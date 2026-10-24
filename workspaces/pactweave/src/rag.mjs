export class RAG {
  constructor(retriever) {
    this.retriever = retriever;
  }
  ingest(document) {
    return this.retriever.ingest({ ...document, kind: "rag" });
  }
  search(query) {
    return this.retriever.search({ ...query, kind: "rag" });
  }
}
export const searchRAG = (retriever, options) =>
  retriever.search({ ...options, kind: "rag" });
