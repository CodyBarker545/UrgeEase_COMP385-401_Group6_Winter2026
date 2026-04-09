from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

from google import genai
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


# test-friendly embeddings
class HashEmbeddings(Embeddings):
    """
    deterministic offline embeddings for tests and local dev
    """

    def __init__(self, dim: int = 128):
        self.dim = dim

    def _embed(self, text: str) -> List[float]:
        # hash tokens into a fixed vector
        tokens = re.findall(r"[a-z0-9']+", text.lower())
        vec = [0.0] * self.dim

        for tok in tokens:
            h = hashlib.md5(tok.encode("utf-8")).hexdigest()
            idx = int(h, 16) % self.dim
            vec[idx] += 1.0

        norm = sum(v * v for v in vec) ** 0.5
        if norm > 0:
            vec = [v / norm for v in vec]

        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text)


# crisis checks
CRISIS_KEYWORDS = [
    "suicide",
    "kill myself",
    "end my life",
    "self-harm",
    "hurt myself",
    "want to die",
    "cut myself",
    "overdose",
    "can't go on",
]


def is_crisis(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in CRISIS_KEYWORDS)


CRISIS_MESSAGE = (
    "I’m really sorry you’re feeling this way. I can’t help with self-harm or suicide plans, "
    "but you deserve immediate support.\n\n"
    "If you’re in immediate danger: call emergency services (911 in Canada/US).\n"
    "Canada: Call or text 988 (Suicide Crisis Helpline).\n"
    "If you can, reach out right now to a trusted person nearby.\n\n"
    "If you want, tell me your country/city and I’ll help you find the right crisis resource."
)


# rag config
@dataclass
class RAGConfig:
    data_dir: str
    index_dir: str
    chunk_size: int = 800
    chunk_overlap: int = 150
    k: int = 4
    use_mmr: bool = True


def _compute_dir_hash(data_dir: str) -> str:
    # hash all txt files recursively
    md5 = hashlib.md5()

    txt_files: List[str] = []
    for root, _, files in os.walk(data_dir):
        for filename in files:
            if filename.lower().endswith(".txt"):
                txt_files.append(os.path.join(root, filename))

    for path in sorted(txt_files):
        relative_path = os.path.relpath(path, data_dir).replace("\\", "/")
        md5.update(relative_path.encode("utf-8"))
        with open(path, "rb") as f:
            md5.update(f.read())

    return md5.hexdigest()


def build_or_load_vectorstore(
    cfg: RAGConfig,
    embeddings: Embeddings,
) -> FAISS:
    # make sure index folder exists
    os.makedirs(cfg.index_dir, exist_ok=True)

    index_path = os.path.join(cfg.index_dir, "index.faiss")
    pkl_path = os.path.join(cfg.index_dir, "index.pkl")
    hash_path = os.path.join(cfg.index_dir, "prev_hash.txt")

    current_hash = _compute_dir_hash(cfg.data_dir)

    # load existing index if corpus did not change
    if (
        os.path.exists(index_path)
        and os.path.exists(pkl_path)
        and os.path.exists(hash_path)
    ):
        with open(hash_path, "r", encoding="utf-8") as f:
            old_hash = f.read().strip()

        if old_hash == current_hash:
            return FAISS.load_local(
                cfg.index_dir,
                embeddings,
                allow_dangerous_deserialization=True,
            )

    # otherwise rebuild it
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=cfg.chunk_size,
        chunk_overlap=cfg.chunk_overlap,
    )

    docs: List[Document] = []

    # load txt files recursively from data dir
    for root, _, files in os.walk(cfg.data_dir):
        for filename in files:
            if filename.lower().endswith(".txt"):
                path = os.path.join(root, filename)
                relative_path = os.path.relpath(path, cfg.data_dir).replace("\\", "/")

                loader = TextLoader(
                    path,
                    encoding="utf-8",
                    autodetect_encoding=True,
                )
                loaded = loader.load()

                # keep source path for citations
                for d in loaded:
                    d.metadata["source"] = relative_path

                docs.extend(splitter.split_documents(loaded))

    vs = FAISS.from_documents(docs, embeddings)
    vs.save_local(cfg.index_dir)

    # save corpus hash
    with open(hash_path, "w", encoding="utf-8") as f:
        f.write(current_hash)

    return vs


# history formatting
def format_history(history: List[Dict[str, str]]) -> str:
    # turn chat history into a simple prompt block
    out = []
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        out.append(f"<turn role='{role}'>{content}</turn>")
    return "\n".join(out)


def build_prompt(chat_history: str, context: str, query: str) -> str:
    return f"""You are UrgeEase, a supportive recovery assistant for behavioral addictions.
You are NOT a licensed therapist. Do NOT diagnose. Do NOT prescribe medication.
Be compassionate, non-judgmental, and practical.

Safety:
- If the user expresses self-harm or suicidal intent, stop normal coaching and provide crisis resources.

Grounding rules:
- Use ONLY <context> and <chat_history> for factual claims.
- If the context does not contain the answer, say you don't have enough information from the provided sources.
- When you use the context, cite sources by filename.

<chat_history>
{chat_history}
</chat_history>

<context>
{context}
</context>

User message: {query}

Respond with:
1) Supportive response
2) 1-3 practical next steps (CBT/ACT style)
3) Sources used (filenames)
"""


# llm adapter
LLMFn = Callable[[str], str]


def fake_llm(prompt: str) -> str:
    """
    offline llm stub for tests and demo checks
    """
    # pull source names out of the prompt
    sources = []
    for line in prompt.splitlines():
        if line.startswith("[SOURCE:"):
            name = line.replace("[SOURCE:", "").replace("]", "").strip()
            sources.append(name)

    seen = set()
    sources_unique = [s for s in sources if not (s in seen or seen.add(s))]
    sources_str = ", ".join(sources_unique) if sources_unique else "none"

    return (
        "1) Supportive response\n"
        "It makes sense to feel stuck sometimes. If you're dealing with urges, we can try a small step right now.\n\n"
        "2) Practical next steps\n"
        "- name the urge (0-10), then pause and breathe slowly for 60 seconds\n"
        "- delay 10 minutes and do a quick replacement action\n"
        "- note the trigger: time, mood, place, or device\n\n"
        "3) Sources used\n"
        f"{sources_str}"
    )

def gemini_llm(prompt: str) -> str:
    """
    Real Gemini-backed LLM function.
    Requires GEMINI_API_KEY in environment.
    """
    print("[gemini_llm] starting")

    from google import genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    print("[gemini_llm] api key found")

    client = genai.Client(api_key=api_key)
    print("[gemini_llm] client created")

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    print("[gemini_llm] response received")

    text = getattr(response, "text", None)
    if not text:
        print("[gemini_llm] empty text response")
        raise RuntimeError("Gemini returned an empty response.")

    print("[gemini_llm] returning text")
    return text

# main rag chain
class UrgeEaseRAGChain:
    def __init__(
        self,
        cfg: RAGConfig,
        embeddings: Embeddings,
        llm_fn: Optional[LLMFn] = None,
    ):
        self.cfg = cfg
        self.embeddings = embeddings
        self.llm_fn = llm_fn or gemini_llm
        self.vectorstore = build_or_load_vectorstore(cfg, embeddings)

        # build retriever
        if cfg.use_mmr:
            self.retriever = self.vectorstore.as_retriever(
                search_type="mmr",
                search_kwargs={"k": cfg.k, "fetch_k": max(10, cfg.k * 3)},
            )
        else:
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": cfg.k})

    def invoke(
        self,
        question: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        # stop and return crisis help if needed
        if is_crisis(question):
            return {
                "result": CRISIS_MESSAGE,
                "source_documents": [],
                "crisis": True,
            }

        chat_history = chat_history or []
        history_str = format_history(chat_history)

        docs = self.retriever.invoke(question)
        context = "\n\n".join(
            [
                f"[SOURCE: {d.metadata.get('source', 'unknown')}]\n{d.page_content}"
                for d in docs
            ]
        )

        prompt = build_prompt(history_str, context, question)
        answer = self.llm_fn(prompt)

        return {
            "result": answer,
            "source_documents": docs,
            "crisis": False,
        }
