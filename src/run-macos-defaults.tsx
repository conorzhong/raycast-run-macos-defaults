import { Action, ActionPanel, Icon, List, showToast, useNavigation } from "@raycast/api";
import { useExec } from "@raycast/utils";
import { outdent } from "outdent";
import { domainList } from "./data/data.json";
import { Demo, Domain, Key } from "./typings";

export default () => {
  const { push } = useNavigation();
  return (
    <List navigationTitle="Defaults" searchBarPlaceholder="Search Domain" isShowingDetail>
      {domainList.map((domain: Domain) => (
        <List.Item
          key={domain.id}
          title={domain.title}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Folder}
                title="Open"
                onAction={() => {
                  push(<KeyList domainId={domain.id} title={domain.title} keyList={domain.keyList} />);
                }}
              />
              <Action.OpenInBrowser url={`https://macos-defaults.com/${domain.id}`} />
            </ActionPanel>
          }
          detail={<List.Item.Detail markdown={domain.descriptionMarkdown} />}
        />
      ))}
    </List>
  );
};

const KeyList = (props: { domainId: string; title: string; keyList: Key[] }) => {
  const { push } = useNavigation();
  return (
    <List navigationTitle={props.title} searchBarPlaceholder={`Search Key`} isShowingDetail>
      {props.keyList.map((key) => (
        <List.Item
          key={key.title}
          title={key.title}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Folder}
                title="Open"
                onAction={() => {
                  push(<DemoList domainId={props.domainId} keyId={key.id} demoList={key.demoList} title={key.title} />);
                }}
              />
              <Action.OpenInBrowser url={`https://macos-defaults.com/${props.domainId}/${key.id}`} />
            </ActionPanel>
          }
          detail={
            <List.Item.Detail
              markdown={outdent`
              ${key.descriptionMarkdown}
              `}
            />
          }
        />
      ))}
    </List>
  );
};

const DemoList = (props: { domainId: string; keyId: string; title: string; demoList: Demo[] }) => {
  return (
    <List navigationTitle={props.title} searchBarPlaceholder="Search Demo" isShowingDetail>
      {props.demoList.map((demo) => {
        return (
          <List.Item
            key={demo.title}
            title={demo.title}
            actions={
              <ActionPanel>
                {demo.shell ? <ShellAction shell={demo.shell} /> : null}
                <Action.OpenInBrowser url={`https://macos-defaults.com/${props.domainId}/${props.keyId}#${demo.id}`} />
              </ActionPanel>
            }
            detail={
              <List.Item.Detail
                markdown={outdent`
                ${demo.descriptionMarkdown}
                `}
              />
            }
          />
        );
      })}
    </List>
  );
};

const ShellAction = (props: { shell: string }) => {
  const { revalidate } = useExec(props.shell, {
    execute: false,
    shell: true,
    onData: (data) => {
      showToast({ title: data || "success" });
    },
  });
  return (
    <Action
      title="Execute"
      icon={Icon.Terminal}
      onAction={() => {
        revalidate();
      }}
    />
  );
};
