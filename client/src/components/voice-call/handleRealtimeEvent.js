import { ItemTypes, RoleTypes, StatusTypes } from "./types";

export default function handleRealtimeEvent(ev, setItems) {
  // Helper function to create a new item with default fields
  function createNewItem(base) {
    return {
      object: "realtime.item",
      timestamp: new Date().toLocaleTimeString(),
      ...base,
    };
  }

  const { type } = ev;

  switch (type) {
    case "session.created": {
      // Starting a new session, clear all items
      setItems([]);
      break;
    }

    case "input_audio_buffer.speech_started": {
      // Create a user message item with running status and placeholder content
      const { item_id } = ev;
      setItems((prev) => [
        ...prev,
        createNewItem({
          id: item_id,
          type: ItemTypes.MESSAGE,
          role: RoleTypes.USER,
          content: [{ type: "text", text: "..." }],
          status: StatusTypes.RUNNING,
        }),
      ]);
      break;
    }

    case "conversation.item.created": {
      const { item } = ev;
      if (item.type === ItemTypes.MESSAGE) {
        // A completed message from user or assistant
        const updatedContent =
          item.content && item.content.length > 0 ? item.content : [];
        setItems((prev) => {
          const idx = prev.findIndex((m) => m.id === item.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              ...item,
              content: updatedContent,
              status: StatusTypes.COMPLETED,
              timestamp:
                updated[idx].timestamp || new Date().toLocaleTimeString(),
            };
            return updated;
          } else {
            return [
              ...prev,
              createNewItem({
                ...item,
                content: updatedContent,
                status: StatusTypes.COMPLETED,
              }),
            ];
          }
        });
      }
      // NOTE: We no longer handle function_call items here.
      // The handling of function_call items has been moved to the "response.output_item.done" event.
      else if (item.type === ItemTypes.FUNCTION_CALL_OUTPUT) {
        // Function call output item created
        // Add the output item and mark the corresponding function_call as completed
        // Also display in transcript as tool message with the response
        setItems((prev) => {
          const newItems = [
            ...prev,
            createNewItem({
              ...item,
              role: RoleTypes.TOOL,
              content: [
                {
                  type: "text",
                  text: `Function call response: ${item.output}`,
                },
              ],
              status: StatusTypes.COMPLETED,
            }),
          ];

          return newItems.map((m) =>
            m.call_id === item.call_id && m.type === ItemTypes.FUNCTION_CALL
              ? { ...m, status: StatusTypes.COMPLETED }
              : m
          );
        });
      }
      break;
    }

    case "conversation.item.input_audio_transcription.completed": {
      // Update the user message with the final transcript
      const { item_id, transcript } = ev;
      setItems((prev) =>
        prev.map((m) =>
          m.id === item_id &&
          m.type === ItemTypes.MESSAGE &&
          m.role === RoleTypes.USER
            ? {
                ...m,
                content: [{ type: "text", text: transcript }],
                status: StatusTypes.COMPLETED,
              }
            : m
        )
      );
      break;
    }

    case "response.content_part.added": {
      const { item_id, part, output_index } = ev;
      // Append new content to the assistant message if output_index == 0
      if (part.type === "text" && output_index === 0) {
        setItems((prev) => {
          const idx = prev.findIndex((m) => m.id === item_id);
          if (idx >= 0) {
            const updated = [...prev];
            const existingContent = updated[idx].content || [];
            updated[idx] = {
              ...updated[idx],
              content: [
                ...existingContent,
                { type: part.type, text: part.text },
              ],
            };
            return updated;
          } else {
            // If the item doesn't exist yet, create it as a running assistant message
            return [
              ...prev,
              createNewItem({
                id: item_id,
                type: ItemTypes.MESSAGE,
                role: RoleTypes.ASSISTANT,
                content: [{ type: part.type, text: part.text }],
                status: StatusTypes.RUNNING,
              }),
            ];
          }
        });
      }
      break;
    }

    case "response.audio_transcript.delta": {
      // Streaming transcript text (assistant)
      const { item_id, delta, output_index } = ev;
      if (output_index === 0 && delta) {
        setItems((prev) => {
          const idx = prev.findIndex((m) => m.id === item_id);
          if (idx >= 0) {
            const updated = [...prev];
            const existingContent = updated[idx].content || [];
            updated[idx] = {
              ...updated[idx],
              content: [...existingContent, { type: "text", text: delta }],
            };
            return updated;
          } else {
            return [
              ...prev,
              createNewItem({
                id: item_id,
                type: ItemTypes.MESSAGE,
                role: RoleTypes.ASSISTANT,
                content: [{ type: "text", text: delta }],
                status: StatusTypes.RUNNING,
              }),
            ];
          }
        });
      }
      break;
    }

    case "response.output_item.done": {
      const { item } = ev;
      if (item.type === ItemTypes.FUNCTION_CALL) {
        // A new function call item
        // Display it in the transcript as an assistant message indicating a function is being requested
        console.log("function_call", item);
        setItems((prev) => [
          ...prev,
          createNewItem({
            ...item,
            role: RoleTypes.ASSISTANT,
            content: [
              {
                type: "text",
                text: `${item.name}(${JSON.stringify(
                  JSON.parse(item.arguments)
                )})`,
              },
            ],
            status: StatusTypes.RUNNING,
          }),
        ]);
      }
      break;
    }

    default:
      break;
  }
}
