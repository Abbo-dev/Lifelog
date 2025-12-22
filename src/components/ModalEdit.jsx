import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Textarea,
  DatePicker,
} from "@heroui/react";
function ModalEdit({ isOpen, onClose, note, onSave }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [dueDate, setDueDate] = useState(
    note?.dueDate ? note.dueDate.toDate() : null
  );

  const ForwardedDatePicker = forwardRef((props, ref) => {
    return <DatePicker {...props} innerRef={ref} />;
  });
  const handleSubmit = async () => {
    try {
      const updatedNote = {
        title: title,
        content: content,
        dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "notes", note.id), updatedNote);
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to update note", error);
    }
  };
  return (
    <>
      <Modal
        isOpen={isOpen}
        placement="center"
        onClose={onClose}
        size="2xl"
        className=" flex-grow  max-w-[500px] rounded-xl  m-5"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex items-center justify-center mx-auto mt-10 pb-3">
                <h3 className="text-2xl font-medium leading-6 text-gray-900 dark:text-white">
                  Create New Note
                </h3>
              </ModalHeader>
              <ModalBody className="flex flex-col  items-center justify-center gap-5 mx-auto w-full">
                <Input
                  isRequired
                  label="Title"
                  placeholder="Title"
                  size="md"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <Textarea
                  isRequired
                  label="Content"
                  placeholder="What's on your mind ?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <ForwardedDatePicker
                  label="Due Date"
                  placeholder="Due Date"
                  size="md"
                  value={dueDate}
                  onChange={(date) => {
                    setDueDate(date);
                  }}
                />
              </ModalBody>
              <ModalFooter className="flex items-center justify-center gap-4 w-full mx-auto pb-8 mb-9">
                <Button onPress={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  color="primary"
                  onPress={handleSubmit}
                >
                  Update
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default ModalEdit;
