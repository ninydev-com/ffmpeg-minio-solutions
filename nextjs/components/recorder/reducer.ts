import { RecorderState, RecordingStatus } from "./types";

// Actions for the reducer kept local to the store implementation
export type Action =
  | { type: "SET_ERROR"; message: string }
  | { type: "SET_STREAM"; stream: MediaStream | null }
  | { type: "SET_RECORDER"; recorder: MediaRecorder | null; mimeType: string | null }
  | { type: "SET_STATUS"; status: RecordingStatus }
  | { type: "PUSH_CHUNK"; chunk: Blob }
  | { type: "CLEAR_CHUNKS" }
  | { type: "SET_BLOB"; blob: Blob | null }
  | { type: "SET_OBJECT_URL"; url: string | null };

export const initialState: RecorderState = {
  status: "idle",
  stream: null,
  recorder: null,
  chunks: [],
  blob: null,
  objectUrl: null,
  mimeType: null,
};

export function reducer(state: RecorderState, action: Action): RecorderState {
  switch (action.type) {
    case "SET_ERROR":
      return { ...state, status: "error", errorMessage: action.message };
    case "SET_STREAM":
      return { ...state, stream: action.stream };
    case "SET_RECORDER":
      return { ...state, recorder: action.recorder, mimeType: action.mimeType };
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "PUSH_CHUNK":
      return { ...state, chunks: [...state.chunks, action.chunk] };
    case "CLEAR_CHUNKS":
      return { ...state, chunks: [] };
    case "SET_BLOB":
      return { ...state, blob: action.blob };
    case "SET_OBJECT_URL":
      return { ...state, objectUrl: action.url };
    default:
      return state;
  }
}
