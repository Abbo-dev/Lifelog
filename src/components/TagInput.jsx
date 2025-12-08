import { useState, useEffect } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import { Button } from '@heroui/react';

const TagInput = ({ tags, onTagsChange, suggestions = [] }) => {
  const [localTags, setLocalTags] = useState(tags.map(tag => ({ id: tag, text: tag })));
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);

  useEffect(() => {
    setLocalTags(tags.map(tag => ({ id: tag, text: tag })));
  }, [tags]);

  const handleDelete = (i) => {
    const newTags = localTags.filter((tag, index) => index !== i);
    setLocalTags(newTags);
    onTagsChange(newTags.map(tag => tag.text));
  };

  const handleAddition = (tag) => {
    const newTags = [...localTags, tag];
    setLocalTags(newTags);
    onTagsChange(newTags.map(tag => tag.text));
    
    // Add to suggestions if it's a new tag
    if (!localSuggestions.includes(tag.text)) {
      setLocalSuggestions([...localSuggestions, tag.text]);
    }
  };

  const handleDrag = (tag, currPos, newPos) => {
    const newTags = [...localTags];
    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);
    setLocalTags(newTags);
    onTagsChange(newTags.map(tag => tag.text));
  };

  return (
    <div className="tag-input">
      <ReactTags
        tags={localTags}
        suggestions={localSuggestions}
        delimiters={[188, 13]} // comma and enter
        handleDelete={handleDelete}
        handleAddition={handleAddition}
        handleDrag={handleDrag}
        placeholder="Add tags..."
        classNames={{
          tags: 'flex flex-wrap gap-2',
          tagInput: 'flex-1',
          tagInputField: 'w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white',
          selected: 'flex flex-wrap gap-2',
          tag: 'flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-lg',
          remove: 'text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100',
          suggestions: 'absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg',
          activeSuggestion: 'bg-blue-100 dark:bg-blue-900',
        }}
      />
    </div>
  );
};

export default TagInput; 