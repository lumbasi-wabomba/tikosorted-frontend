import { createTask, deleteTask, getTasks, updateTask, updateTaskDetails } from '../utils/api'
import { useRequest, useMutation } from './useRequest'

// Load all tasks. Call reload() after changing one to refresh the list.
export function useTasks() {
  return useRequest(() => getTasks())
}

// Load a single task
export function useTask(taskId) {
  return useRequest(() => getTasks().then((tasks) => tasks.find((task) => task.id === taskId)), [taskId])
}

// Create a new task.
//   const create = useAddTask()
//   create.mutateAsync({ eventId, title, deadline })
export function useAddTask() {
  return useMutation((task) => createTask(task))
}

// Update a task. Call with { status } for a quick status change, or with a
// full edit payload { status, title, deadline, resource }.
//   const update = useUpdateTask(taskId)
//   update.mutate({ status: 'COMPLETED' })
export function useUpdateTask(taskId) {
  return useMutation((updates) => {
    const onlyStatus = updates && 'status' in updates && Object.keys(updates).length === 1
    if (onlyStatus) return updateTask(taskId, { status: updates.status })
    return updateTaskDetails(taskId, updates)
  })
}

// Delete a task.
export function useDeleteTask(taskId) {
  return useMutation(() => deleteTask(taskId))
}