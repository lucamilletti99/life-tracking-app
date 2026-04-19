import type { Todo } from "../types";
import { mockTodos, mockTodoGoalLinks } from "../mock-data";

let todos = [...mockTodos];
let links = [...mockTodoGoalLinks];

export const todosService = {
  list: (): Todo[] => todos,
  get: (id: string): Todo | undefined => todos.find((t) => t.id === id),
  forDateRange: (start: string, end: string): Todo[] =>
    todos.filter((t) => t.start_datetime >= start && t.start_datetime < end),
  create: (data: Omit<Todo, "id" | "created_at" | "updated_at">): Todo => {
    const todo: Todo = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    todos = [...todos, todo];
    return todo;
  },
  update: (id: string, data: Partial<Todo>): Todo => {
    todos = todos.map((t) =>
      t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t,
    );
    return todos.find((t) => t.id === id)!;
  },
  delete: (id: string): void => {
    todos = todos.filter((t) => t.id !== id);
  },
  getLinkedGoalIds: (todoId: string): string[] =>
    links.filter((l) => l.todo_id === todoId).map((l) => l.goal_id),
};
