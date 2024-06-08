export interface Domain {
  id: string;
  title: string;
  descriptionMarkdown: string;
  keyList: Key[];
}

export interface Key {
  id: string;
  title: string;
  descriptionMarkdown: string;
  demoList: Demo[];
}

export interface Demo {
  id: string;
  title: string;
  descriptionMarkdown: string;
  shell?: string;
}
