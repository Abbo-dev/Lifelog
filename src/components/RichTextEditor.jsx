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
import { useRef, useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { ensureProtocol } from '../utils/linkUtils';
import ImageNode from '../extensions/ImageNode';
import { auth, storage } from '../firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const NOTE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const NOTE_IMAGE_MAX_DIMENSION = 2048;
const NOTE_IMAGE_OUTPUT_MIME_TYPE = 'image/webp';
const NOTE_IMAGE_OUTPUT_QUALITY = 0.82;

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to encode the image.'));
      },
      mimeType,
      quality
    );
  });

const loadImageSource = async (file) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load the image.'));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const createSafeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const guessExtension = (mimeType) => {
  const lower = (mimeType || '').toLowerCase();
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'jpg';
  if (lower.includes('png')) return 'png';
  if (lower.includes('gif')) return 'gif';
  return 'bin';
};

const prepareNoteImageBlob = async (file) => {
  if (!file?.type?.startsWith('image/')) throw new Error('Please select an image.');
  if (file.size > NOTE_IMAGE_MAX_BYTES) throw new Error('Image must be under 10MB.');

  if (file.type === 'image/gif') return file;

  const source = await loadImageSource(file);
  const sourceWidth = 'naturalWidth' in source ? source.naturalWidth : source.width || 0;
  const sourceHeight = 'naturalHeight' in source ? source.naturalHeight : source.height || 0;

  if (!sourceWidth || !sourceHeight) {
    if (typeof source.close === 'function') source.close();
    throw new Error('Unable to read image dimensions.');
  }

  const scale = Math.min(1, NOTE_IMAGE_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  if (scale === 1 && file.type === NOTE_IMAGE_OUTPUT_MIME_TYPE) {
    if (typeof source.close === 'function') source.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    if (typeof source.close === 'function') source.close();
    throw new Error('Unable to create canvas context.');
  }

  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  if (typeof source.close === 'function') source.close();

  let blob;
  try {
    blob = await canvasToBlob(canvas, NOTE_IMAGE_OUTPUT_MIME_TYPE, NOTE_IMAGE_OUTPUT_QUALITY);
  } catch {
    blob = await canvasToBlob(canvas, 'image/jpeg', NOTE_IMAGE_OUTPUT_QUALITY);
  }

  return blob.size < file.size ? blob : file;
};

const MenuBar = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
    if (!href) {
      window.alert('Please enter a valid URL.');
      return;
    }
    editor.chain().focus().setLink({ href }).run();
  };

  const normalizeImageSrc = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('/')) return trimmed;

    const candidate = trimmed.includes('://')
      ? trimmed
      : `https://${trimmed.replace(/^\/+/, '')}`;

    try {
      const url = new URL(candidate);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
      return url.toString();
    } catch {
      return '';
    }
  };

  const addImage = () => {
    const raw = window.prompt('Enter image URL');
    if (!raw) return;

    const src = normalizeImageSrc(raw);
    if (!src) {
      window.alert('Please enter a valid http(s) image URL.');
      return;
    }

    editor.chain().focus().setImage({ src }).run();
  };

  const uploadImages = async (files) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      window.alert('Please sign in again to upload images.');
      return;
    }

    const list = Array.from(files || []).filter(Boolean);
    if (list.length === 0) return;

    setIsUploadingImage(true);
    try {
      for (const file of list) {
        const blob = await prepareNoteImageBlob(file);
        const extension = guessExtension(blob.type || file.type);
        const storageRef = ref(storage, `notes/${userId}/images/${createSafeId()}.${extension}`);
        await uploadBytes(storageRef, blob, { contentType: blob.type || file.type });
        const url = await getDownloadURL(storageRef);
        editor.chain().focus().setImage({ src: url, alt: file.name || 'Uploaded image' }).run();
      }
    } catch (error) {
      window.alert(error?.message || 'Unable to upload image.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      <Button size="sm" variant="light" onPress={addImage}>
        🖼 Image
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => uploadImages(event.target.files)}
      />
      <Button
        size="sm"
        variant="light"
        isDisabled={isUploadingImage}
        onPress={() => fileInputRef.current?.click()}
      >
        {isUploadingImage ? 'Uploading…' : '⬆️ Upload'}
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
      ImageNode,
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
