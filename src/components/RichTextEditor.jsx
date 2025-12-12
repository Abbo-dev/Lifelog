import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Button } from '@heroui/react';
import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { ensureProtocol } from '../utils/linkUtils';

const MenuBar = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleColorChange = (color) => {
    setCurrentColor(color);
    editor.chain().focus().setColor(color).run();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;

    const href = ensureProtocol(url);
    editor.chain().focus().setLink({ href }).run();
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <span className="font-bold">B</span>
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <span className="italic">I</span>
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <span className="line-through">S</span>
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleHighlight().run()}
        className={editor.isActive('highlight') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <span className="bg-yellow-200 dark:bg-yellow-800 px-1">H</span>
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        H1
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        H2
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        • List
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        1. List
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive('taskList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        ☐ Tasks
      </Button>
      <Button
        size="sm"
        variant="light"
        onPress={addLink}
        className={editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        🔗 Link
      </Button>
      <div className="relative">
        <Button
          size="sm"
          variant="light"
          onPress={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center gap-1"
        >
          <span>🎨</span>
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
        </Button>
        {showColorPicker && (
          <div className="absolute z-50 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <HexColorPicker color={currentColor} onChange={handleColorChange} />
          </div>
        )}
      </div>
    </div>
  );
};

const RichTextEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Color,
      TextStyle,
      Highlight,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: 'What\'s on your mind?',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 min-h-[150px] focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return (
    <div className="border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor; 
