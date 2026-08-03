import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export default function TextEditor({ value, onChange }) {
    return (
        <CKEditor
            editor={ClassicEditor}
            data={value}
            config={{
                licenseKey: 'GPL',
                toolbar: [
                    "undo",
                    "redo",
                    "|",
                    "heading",
                    "|",
                    "bold",
                    "italic",
                    "link",
                    "|",
                    "bulletedList",
                    "numberedList",
                    "|",
                    "outdent", // ⬅️
                    "indent",  // ⬅️
                    "|",
                    "insertTable",
                    "mediaEmbed",
                    "|",
                    "blockQuote"
                ]
            }}
            onChange={(event, editor) => {
                onChange(editor.getData());
            }}
        />
    );
}
