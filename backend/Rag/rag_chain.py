from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


CATEGORY_KEYWORDS = {
    "sleep_and_routine": [
        "bed",
        "bedtime",
        "late night",
        "night",
        "sleep",
        "tired",
        "wake",
        "wind down",
    ],
    "habit_tracking": [
        "automatic",
        "check",
        "checking",
        "distracted",
        "focus",
        "log",
        "study",
        "tracking",
        "work",
    ],
    "habit_replacement": [
        "alternative",
        "bored",
        "boredom",
        "craving",
        "replacement",
        "routine",
        "urge",
    ],
    "relapse_prevention": [
        "relapse",
        "setback",
        "slip",
        "again",
        "failed",
    ],
    "coping_strategies": [
        "anxious",
        "cope",
        "coping",
        "depressed",
        "down",
        "mood",
        "stress",
        "worry",
    ],
    "social_media_addiction_research": [
        "compare",
        "comparison",
        "like",
        "likes",
        "validation",
        "successful",
        "people",
    ],
}

# Keyword routing keeps offline retrieval focused without calling an external LLM.
QUERY_EXPANSIONS = {
    "sleep_and_routine": "sleep bedtime night routine wind-down phone away from bed",
    "habit_tracking": "focus distraction study work automatic checking trigger log",
    "habit_replacement": "urge craving boredom replacement activity delay",
    "relapse_prevention": "relapse setback slip prevention recovery plan",
    "coping_strategies": "stress worry low mood coping grounding CBT ACT",
    "social_media_addiction_research": "social comparison validation likes self-worth",
}


ASSISTANT_BEHAVIOR_CONTRACT = """Assistant behavior:
- Primary goal: help the user take one small useful step in the next few minutes.
- Tone: warm, steady, professional, and direct. Do not sound dramatic, clinical, or overly cheerful.
- Length: normally 2 or 3 short sentences. Use at most 4 sentences.
- Structure: no headings, no numbered lists, no bullet lists, no markdown, and no source section.
- Personalization: use assessment, plan, history, and retrieved RAG content only when it directly helps the current message.
- Relevance: answer the user's immediate struggle first; do not explain the whole assessment unless asked.
- Evidence use: translate retrieved guidance into plain language. Do not quote or name source files unless asked.
- Boundaries: do not diagnose, shame, moralize, promise outcomes, or pretend to be a therapist.
- Safety: if the user may be in danger, prioritize crisis support over coaching."""


MAX_LOCAL_RESPONSE_SENTENCES = 4


# Infers the content category from a source path.
def infer_category(source_path: str) -> str:
    normalized = source_path.replace("\\", "/").lower()
    for category in CATEGORY_KEYWORDS:
        if category in normalized:
            return category
    return "general"


# Infers the strategy type from a source path.
def infer_strategy_type(source_path: str) -> str:
    normalized = source_path.replace("\\", "/").lower()
    if "cbt" in normalized:
        return "cbt"
    if "habit" in normalized:
        return "habit"
    if "sleep" in normalized or "routine" in normalized:
        return "routine"
    if "relapse" in normalized:
        return "relapse_prevention"
    if "research" in normalized or "review" in normalized or "meta" in normalized:
        return "research"
    return "psychoeducation"


# Detects likely categories for a user query.
def detect_query_categories(query: str) -> List[str]:
    lowered = query.lower()
    scored: list[tuple[int, str]] = []

    # Count simple keyword hits to pick the most likely trigger categories.
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in lowered)
        if score > 0:
            scored.append((score, category))
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [category for _, category in scored[:2]]


# Adds related terms to improve document search.
def expand_query(query: str) -> str:
    categories = detect_query_categories(query)
    expansions = [QUERY_EXPANSIONS[category] for category in categories]
    if not expansions:
        return query
    return f"{query}\n\nRelevant recovery topics: {' '.join(expansions)}"


# Limits text to a small number of sentences.
def limit_sentences(text: str, max_sentences: int = MAX_LOCAL_RESPONSE_SENTENCES) -> str:
    # Final guardrail so chat/voice output stays short in demo mode.
    sentences = re.findall(r"[^.!?]+[.!?]+|[^.!?]+$", text.strip())
    limited = "".join(sentences[:max_sentences]).strip()
    return re.sub(r"\s+", " ", limited)


# test-friendly embeddings
class HashEmbeddings(Embeddings):
    """
    deterministic offline embeddings for tests and local dev
    """

    # Sets up the service with the helpers it needs.
    def __init__(self, dim: int = 128):
        self.dim = dim

    # Creates a simple hash embedding for text.
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

    # Embeds a list of documents.
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]

    # Embeds one search query.
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


# Checks whether text contains crisis language.
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


CRISIS_MESSAGE = (
    "I'm really sorry you're feeling this way. I can't help with self-harm or suicide plans, "
    "but you deserve immediate support.\n\n"
    "If you're in immediate danger: call emergency services (911 in Canada/US).\n"
    "Canada: Call or text 988 (Suicide Crisis Helpline).\n"
    "If you can, reach out right now to a trusted person nearby.\n\n"
    "If you want, tell me your country/city and I'll help you find the right crisis resource."
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


# Builds a hash for the RAG data directory.
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


# Builds or loads the RAG vector store.
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

    # Reuse the FAISS index when the local knowledge files have not changed.
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

                # Store routing metadata so retrieval can prefer the right topic.
                for d in loaded:
                    d.metadata["source"] = relative_path
                    d.metadata["category"] = infer_category(relative_path)
                    d.metadata["strategy_type"] = infer_strategy_type(relative_path)

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


# Builds the prompt sent to the chat model.
def build_prompt(chat_history: str, context: str, query: str) -> str:
    return f"""You are UrgeEase, a supportive recovery assistant for behavioral addictions.
You are NOT a licensed therapist. Do NOT diagnose. Do NOT prescribe medication.
Be compassionate, non-judgmental, and practical.

Safety:
- If the user expresses self-harm or suicidal intent, stop normal coaching and provide crisis resources.

{ASSISTANT_BEHAVIOR_CONTRACT}

Grounding rules:
- Use ONLY <context> and <chat_history> for factual claims.
- If the context does not contain the answer, say you don't have enough information from the provided sources.
- Use the retrieved source content silently. Do not mention filenames, citations, source lists, or the word "context" unless the user asks.
- Prefer context whose category matches the user's main trigger pattern, such as sleep, focus, validation, mood, relapse, or habit replacement.

Voice/chat style:
- Write like a calm, professional coach speaking directly to the user.
- Keep it natural for text-to-speech: short sentences, no numbered sections, no markdown tables, no academic summary.
- Start with a brief acknowledgement, then give one or two concrete next steps.
- Avoid copying source wording; translate it into plain language.

<chat_history>
{chat_history}
</chat_history>

<context>
{context}
</context>

User message: {query}

Respond as one concise chat message that follows the assistant behavior contract.
"""


# llm adapter
LLMFn = Callable[[str], str]


# Extracts the latest user message from a prompt.
def _prompt_user_message(prompt: str) -> str:
    match = re.search(r"User message:\s*(.+?)(?:\n\nRespond|\Z)", prompt, re.DOTALL)
    if not match:
        return ""

    raw_message = match.group(1).strip()
    return raw_message.split("\n\n", 1)[0].strip()


# Finds category hints in the prompt.
def _prompt_categories(prompt: str) -> list[str]:
    categories: list[str] = []
    for line in prompt.splitlines():
        if line.startswith("[SOURCE:"):
            match = re.search(r"\[CATEGORY:\s*([^\]]+)\]", line)
            if match:
                categories.append(match.group(1).strip())

    seen = set()
    return [category for category in categories if not (category in seen or seen.add(category))]


# Creates a local rule-based chat response.
def local_chat_llm(prompt: str) -> str:
    """
    Local demo response generator.

    This keeps UrgeEase usable without Gemini or any network calls. It uses the
    retrieved RAG categories plus the user's message to produce short coaching
    text. Gemini support is still available in llm_service.py for a future mode
    if the project needs richer generation later.
    """
    user_message = _prompt_user_message(prompt)

    # The local generator uses retrieved categories instead of open-ended generation.
    categories = _prompt_categories(prompt) or detect_query_categories(user_message)
    primary_category = categories[0] if categories else "general"

    opener = "I hear you, and we can keep this small enough to do right now."
    if user_message and "assessment context" not in user_message.lower() and len(user_message) <= 90:
        opener = f"I hear you. {user_message}"

    category_steps = {
        "sleep_and_routine": (
            "For tonight, set one phone-free wind-down block and keep the phone away from the bed. "
            "If the urge shows up, wait 10 minutes and do one quiet replacement action."
        ),
        "habit_tracking": (
            "Try one phone-free focus block, even if it is only 15 minutes. "
            "Before you start, write down what usually pulls you back into checking."
        ),
        "habit_replacement": (
            "When the urge hits, name it from 0 to 10 and delay for one minute before doing anything. "
            "Then switch to a replacement action like standing up, getting water, or moving rooms."
        ),
        "relapse_prevention": (
            "A slip does not erase progress. "
            "Look for the moment right before it happened, then choose one barrier you can add next time."
        ),
        "coping_strategies": (
            "Pause and slow your breathing for one minute before deciding what to do next. "
            "Then choose one grounding action, like naming five things you can see or stepping away from the device."
        ),
        "social_media_addiction_research": (
            "Try treating likes and comparison as a trigger, not as a judgment about you. "
            "Take a short break from checking, then do one offline action that reminds you your worth is not measured there."
        ),
        "general": (
            "Pick one trigger to watch today: time, mood, place, or device. "
            "When it appears, delay for 10 minutes and choose one small replacement action."
        ),
    }

    return limit_sentences(
        f"{opener} {category_steps.get(primary_category, category_steps['general'])}"
    )


# Returns a simple fake model response.
def fake_llm(prompt: str) -> str:
    """
    Backward-compatible offline LLM stub for tests.
    """
    return local_chat_llm(prompt)


# Gets a response from Gemini when configured.
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
    # Sets up the service with the helpers it needs.
    def __init__(
        self,
        cfg: RAGConfig,
        embeddings: Embeddings,
        llm_fn: Optional[LLMFn] = None,
    ):
        self.cfg = cfg
        self.embeddings = embeddings
        self.llm_fn = llm_fn or local_chat_llm
        self.vectorstore = build_or_load_vectorstore(cfg, embeddings)

        # build retriever
        if cfg.use_mmr:
            self.retriever = self.vectorstore.as_retriever(
                search_type="mmr",
                search_kwargs={"k": cfg.k, "fetch_k": max(10, cfg.k * 3)},
            )
        else:
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": cfg.k})

    # Runs the RAG chain for a user query.
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

        retrieval_query = expand_query(question)
        docs = self.retriever.invoke(retrieval_query)
        context = "\n\n".join(
            [
                (
                    f"[SOURCE: {d.metadata.get('source', 'unknown')}]"
                    f"[CATEGORY: {d.metadata.get('category', 'general')}]"
                    f"[STRATEGY: {d.metadata.get('strategy_type', 'psychoeducation')}]\n"
                    f"{d.page_content}"
                )
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
