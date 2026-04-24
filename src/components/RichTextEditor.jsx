import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Button } from '@heroui/react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { ensureProtocol } from '../utils/linkUtils';
import ImageNode from '../extensions/ImageNode';
import { auth, storage } from '../firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const NOTE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const NOTE_IMAGE_MAX_DIMENSION = 2048;
const NOTE_IMAGE_OUTPUT_MIME_TYPE = 'image/webp';
const NOTE_IMAGE_OUTPUT_QUALITY = 0.82;

const QUICK_COLORS = [
  '#000000', '#434343', '#FF0000', '#FF6900',
  '#FFD600', '#00C853', '#2196F3', '#9C27B0',
];

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

/* ── Toolbar separator ─────────────────────────────────────── */
const Sep = () => (
  <div className="rte-sep" />
);

/* ── Toolbar button ─────────────────────────────────────────── */
const TBtn = ({ onPress, isActive, isDisabled, title, ariaLabel, children }) => (
  <Button
    size="sm"
    variant="light"
    isDisabled={isDisabled}
    onPress={onPress}
    className={`rte-btn ${isActive ? 'rte-btn-active' : ''}`}
    aria-label={ariaLabel || title}
    title={title}
  >
    {children}
  </Button>
);

/* ── Menu Bar ──────────────────────────────────────────────── */
const MenuBar = ({ editor, isPremium = false }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const fileInputRef = useRef(null);
  const colorPickerRef = useRef(null);
  const colorBtnRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  /* Sync the swatch color from the editor selection */
  const syncColorFromEditor = useCallback(() => {
    if (!editor) return;
    const attrs = editor.getAttributes('textStyle');
    const active = attrs?.color || '';
    setCurrentColor(active || '#000000');
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on('selectionUpdate', syncColorFromEditor);
    editor.on('transaction', syncColorFromEditor);
    return () => {
      editor.off('selectionUpdate', syncColorFromEditor);
      editor.off('transaction', syncColorFromEditor);
    };
  }, [editor, syncColorFromEditor]);

  /* Click-outside to close color picker */
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target) &&
        colorBtnRef.current &&
        !colorBtnRef.current.contains(e.target)
      ) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [showColorPicker]);

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

  const clearColor = () => {
    setCurrentColor('#000000');
    editor.chain().focus().unsetColor().run();
    setShowColorPicker(false);
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
    if (!isPremium) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

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
    <div className="rte-toolbar">
      {/* ── Undo / Redo ────────────────────── */}
      <TBtn
        onPress={() => editor.chain().focus().undo().run()}
        isDisabled={!editor.can().undo()}
        title="Undo"
      >
        ↩
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().redo().run()}
        isDisabled={!editor.can().redo()}
        title="Redo"
      >
        ↪
      </TBtn>

      <Sep />

      {/* ── Inline formatting ──────────────── */}
      <TBtn
        onPress={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <span className="font-bold">B</span>
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <span className="italic">I</span>
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <span className="underline">U</span>
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <span className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">H</span>
      </TBtn>

      <Sep />

      {/* ── Headings ───────────────────────── */}
      <TBtn
        onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </TBtn>

      <Sep />

      {/* ── Text alignment ─────────────────── */}
      <TBtn
        onPress={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align left"
      >
        ≡
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align center"
      >
        ≡
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align right"
      >
        ≡
      </TBtn>

      <Sep />

      {/* ── Lists & blocks ─────────────────── */}
      <TBtn
        onPress={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <span className="flex items-center gap-0.5">
          <span aria-hidden="true">•</span>
          <span className="hidden sm:inline">List</span>
        </span>
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <span className="flex items-center gap-0.5">
          <span aria-hidden="true">1.</span>
          <span className="hidden sm:inline">List</span>
        </span>
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task list"
      >
        <span className="flex items-center gap-0.5">
          <span aria-hidden="true">☐</span>
          <span className="hidden sm:inline">Tasks</span>
        </span>
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        ❝
      </TBtn>
      <TBtn
        onPress={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code block"
      >
        {'</>'}
      </TBtn>

      <Sep />

      {/* ── Insert ─────────────────────────── */}
      <TBtn
        onPress={addLink}
        isActive={editor.isActive('link')}
        title="Add link"
      >
        <span className="flex items-center gap-0.5">
          <span aria-hidden="true">🔗</span>
          <span className="hidden sm:inline">Link</span>
        </span>
      </TBtn>
      <TBtn
        onPress={addImage}
        title="Add image"
      >
        <span className="flex items-center gap-0.5">
          <span aria-hidden="true">🖼</span>
          <span className="hidden sm:inline">Image</span>
        </span>
      </TBtn>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => uploadImages(event.target.files)}
      />
      <TBtn
        isDisabled={isUploadingImage || !isPremium}
        onPress={() => fileInputRef.current?.click()}
        title={!isPremium ? 'Image upload is a Premium feature' : isUploadingImage ? 'Uploading image' : 'Upload image'}
      >
        <span className="flex items-center gap-0.5">
          <span aria-hidden="true">{isUploadingImage ? '⏳' : '⬆️'}</span>
          <span className="hidden sm:inline">
            {isUploadingImage ? 'Uploading…' : 'Upload'}
          </span>
        </span>
      </TBtn>

      <Sep />

      {/* ── Color picker ───────────────────── */}
      <div className="relative" ref={colorBtnRef}>
        <Button
          size="sm"
          variant="light"
          onPress={() => setShowColorPicker((v) => !v)}
          className="rte-btn flex items-center gap-1"
          aria-label="Text color"
          title="Text color"
        >
          <span>A</span>
          <div
            className="w-4 h-1.5 rounded-sm"
            style={{ backgroundColor: currentColor }}
          />
        </Button>
        {showColorPicker && (
          <div ref={colorPickerRef} className="rte-color-dropdown">
            <div className="rte-quick-colors">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorChange(c)}
                  className={`rte-quick-swatch ${currentColor === c ? 'rte-quick-swatch-active' : ''}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Set color ${c}`}
                />
              ))}
            </div>
            <HexColorPicker color={currentColor} onChange={handleColorChange} />
            <button
              type="button"
              onClick={clearColor}
              className="rte-reset-color"
            >
              Reset to default
            </button>
          </div>
        )}
      </div>

      {/* ── Clear formatting ───────────────── */}
      <TBtn
        onPress={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear formatting"
      >
        ✕
      </TBtn>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, className = '', isPremium = false }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Color,
      TextStyle,
      Highlight,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
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
        class: `prose prose-sm sm:prose dark:prose-invert max-w-none p-3 sm:p-4 min-h-[140px] sm:min-h-[150px] focus:outline-none ${className}`.trim(),
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
      <MenuBar editor={editor} isPremium={isPremium} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor; 
