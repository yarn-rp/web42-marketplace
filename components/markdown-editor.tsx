"use client"

import type { ForwardedRef } from "react"
import {
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  UndoRedo,
  DiffSourceToggleWrapper,
  Separator,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"

function MarkdownEditorToolbar() {
  return (
    <DiffSourceToggleWrapper>
      <UndoRedo />
      <Separator />
      <BoldItalicUnderlineToggles />
      <CodeToggle />
      <Separator />
      <ListsToggle />
      <Separator />
      <BlockTypeSelect />
      <Separator />
      <CreateLink />
      <InsertImage />
      <InsertTable />
      <InsertThematicBreak />
    </DiffSourceToggleWrapper>
  )
}

export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <MDXEditor
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            js: "JavaScript",
            ts: "TypeScript",
            tsx: "TSX",
            jsx: "JSX",
            css: "CSS",
            html: "HTML",
            json: "JSON",
            python: "Python",
            bash: "Bash",
            shell: "Shell",
            yaml: "YAML",
            sql: "SQL",
            "": "Plain Text",
          },
        }),
        diffSourcePlugin({ viewMode: "rich-text" }),
        toolbarPlugin({
          toolbarContents: () => <MarkdownEditorToolbar />,
        }),
      ]}
      {...props}
      ref={editorRef}
    />
  )
}
