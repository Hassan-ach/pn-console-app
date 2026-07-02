export interface InputInsight {
  id: number
  type: 'task' | 'urgency' | 'info' | 'decision'
  content: string
}

export interface InputMessage {
  id: number
  content: string
}
