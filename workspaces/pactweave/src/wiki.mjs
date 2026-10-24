export class Wiki {
  constructor(retriever) {
    this.retriever = retriever;
  }
  ingest(document) {
    return this.retriever.ingest({ ...document, kind: "wiki" });
  }
  search(query) {
    return this.retriever.search({ ...query, kind: "wiki" });
  }
}
export const searchWiki = (retriever, options) =>
  retriever.search({ ...options, kind: "wiki" });
