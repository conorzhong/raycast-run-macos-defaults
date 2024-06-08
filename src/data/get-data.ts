import fs from "fs";
import { Heading, Html, Nodes, Root, RootContent } from "mdast";
import path from "path";
import between from "unist-util-find-all-between";
import walkSync from "walk-sync";
import { Demo, Domain, Key } from "../typings";

(async () => {
  const { select, selectAll } = await import("unist-util-select");
  const { findAllAfter } = await import("unist-util-find-all-after");
  const { filter } = await import("unist-util-filter");
  const { fromMarkdown } = await import("mdast-util-from-markdown");
  const { toMarkdown } = await import("mdast-util-to-markdown");
  const { toString } = await import("mdast-util-to-string");
  const { kebabCase } = await import("lodash-es");

  // Define the folder path
  const folderPath = "./external/macos-defaults/docs";
  // Get the list of domains and write the data to a JSON file
  const domainList: Domain[] = await getDomainList(folderPath);
  fs.writeFileSync("./src/data/data.json", JSON.stringify({ domainList }));

  /**
   * Retrieve the list of domains from the specified folder
   */
  async function getDomainList(folderPath: string) {
    const fileList = walkSync(folderPath, { directories: false, globs: ["**/index.md"], ignore: ["index.md"] });
    const resultList = await Promise.all(
      fileList.map(async (file) => {
        const id = file.slice(0, file.indexOf("/"));

        const tree = fromMarkdown(fs.readFileSync(path.join(folderPath, file), "utf8"));

        const headingNodeList = selectAll("heading", tree) as Heading[];
        const { title, descriptionMarkdown } = getTitleDescription(
          toTree([headingNodeList[0], ...betweenOrAfter(tree, headingNodeList[0], headingNodeList[1])]),
        );

        // Process key
        const idFolderPath = path.join(folderPath, id);
        const keyList = await getKeyList(idFolderPath);

        const domain: Domain = { id, title, descriptionMarkdown, keyList };
        return domain;
      }),
    );
    return resultList;
  }

  /**
   * Retrieve the list of keys from the specified folder path
   */
  async function getKeyList(folderPath: string) {
    const fileList = walkSync(folderPath, { directories: false, globs: ["*.md"], ignore: ["index.md"] });
    const resultList = await Promise.all(
      fileList.map(async (file) => {
        const id = file.replace(".md", "");

        const tree = fromMarkdown(fs.readFileSync(path.join(folderPath, file), "utf8"));

        const headingNodeList = selectAll("heading", tree) as Heading[];
        const { title, descriptionMarkdown } = getTitleDescription(
          toTree([headingNodeList[0], ...betweenOrAfter(tree, headingNodeList[0], headingNodeList[1])]),
        );

        // Process demo
        const demoList = await getDemoList(tree);

        const key: Key = { id, title, descriptionMarkdown, demoList };
        return key;
      }),
    );
    return resultList;
  }
  /**
   * Retrieve the list of demos from the tree
   */
  async function getDemoList(tree: Nodes) {
    const heading2NodeList = (selectAll("heading", tree) as Heading[]).filter((node) => node.depth === 2);

    const resultList: Demo[] = [];
    for (let index = 0; index < heading2NodeList.length; index++) {
      const currNode = heading2NodeList[index];
      const nextNode = heading2NodeList[index + 1];

      const { title, descriptionMarkdown, descriptionTree } = getTitleDescription(
        toTree([currNode, ...betweenOrAfter(tree, currNode, nextNode)]),
      );
      const shell = toString(select("code", descriptionTree));
      const id = kebabCase(title);

      const demo = { id, title, descriptionMarkdown, shell };
      resultList.push(demo);
    }

    return resultList;
  }

  /**
   * Extract the title and description from the tree structure
   *
   * title: the first heading
   * description: title to next heading or after title
   */
  function getTitleDescription(tree: Nodes) {
    let titleNode: Heading, title: string, descriptionTree: Nodes, descriptionMarkdown: string;
    const headingNodeList = selectAll("heading", tree) as Heading[];

    if (headingNodeList.length >= 1) {
      titleNode = headingNodeList[0];
      title = toString(titleNode);

      const nextTitleNode = headingNodeList[1];
      descriptionTree = transformTree(toTree(betweenOrAfter(tree, titleNode, nextTitleNode)));
      descriptionMarkdown = toMarkdown(descriptionTree);
    } else {
      throw new Error("Error at getTitleDescription");
    }

    return { title, titleNode, descriptionMarkdown, descriptionTree };
  }

  /**
   * Helper function to extract content between nodes
   */
  function betweenOrAfter(tree: Nodes, start: RootContent, end: RootContent): RootContent[] {
    if ("children" in tree) {
      const result = end ? between(tree, start, end) : findAllAfter(tree, start);
      return result as RootContent[];
    } else {
      throw new Error("Error at betweenOrAfter");
    }
  }

  /**
   * Create a tree structure from a list of node
   */
  function toTree(nodeList: RootContent[]): Root {
    return { type: "root", children: nodeList };
  }

  /**
   * Transform the tree structure
   *
   * Remove some node which can not be rendered in raycast markdown
   */
  function transformTree(tree: Nodes) {
    // Remove or replace specific HTML nodes
    const filtered = filter(tree, (node) => {
      if (node.type === "html") {
        const htmlNode = node as Html;
        if (htmlNode.value.startsWith("<img")) return false;
        if (htmlNode.value.startsWith("<video")) return false;
        if (htmlNode.value.startsWith("<a") || htmlNode.value.startsWith("</a")) return false;
      }

      return true;
    });
    if (filtered) {
      return filtered;
    } else {
      throw new Error("Error at transformTree");
    }
  }
})();
