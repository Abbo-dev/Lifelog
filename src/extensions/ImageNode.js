import { Node, mergeAttributes } from "@tiptap/core";

const ImageNode = Node.create({
  name: "image",
  inline: true,
  group: "inline",
  draggable: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "max-w-full rounded-lg",
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});

export default ImageNode;

