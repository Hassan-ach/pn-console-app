export interface InputInsight {
  id: number
  type: 'TASK' | 'URGENCY' | 'INFO' | 'DECISION'
  content: string
}

export interface InputMessage {
  id: number
  content: string
}
