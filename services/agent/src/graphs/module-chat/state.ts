import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';
import type { ModuleBlueprint } from '@autodidact/types';

export type TeachingPhase = 'introduction' | 'teaching' | 'practice' | 'evaluation';

export const ModuleChatState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer }),
  moduleBlueprint: Annotation<ModuleBlueprint>(),
  userId: Annotation<string>(),
  teachingPhase: Annotation<TeachingPhase>(),
  completionSignaled: Annotation<boolean>(),
  completionScore: Annotation<number | null>(),
});

export type ModuleChatStateType = typeof ModuleChatState.State;
