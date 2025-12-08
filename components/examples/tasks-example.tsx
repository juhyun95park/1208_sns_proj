/**
 * @file tasks-example.tsx
 * @description Clerk + Supabase 통합 예시 컴포넌트
 *
 * 이 컴포넌트는 Clerk와 Supabase를 통합하여 사용하는 방법을 보여줍니다.
 * Client Component와 Server Component 두 가지 방식으로 구현되어 있습니다.
 *
 * 주요 기능:
 * 1. 사용자의 tasks 조회
 * 2. 새 task 생성
 * 3. task 완료 상태 토글
 * 4. task 삭제
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증
 * - @supabase/supabase-js: Supabase 클라이언트
 */

'use client';

import { useState, useEffect } from 'react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAuth } from '@clerk/nextjs';

interface Task {
  id: number;
  name: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

/**
 * Tasks 예시 컴포넌트 (Client Component)
 *
 * useClerkSupabaseClient 훅을 사용하여 Clerk 인증과 함께
 * Supabase 데이터를 조회하고 수정합니다.
 */
export function TasksExample() {
  const supabase = useClerkSupabaseClient();
  const { isLoaded, userId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskName, setTaskName] = useState('');

  // Tasks 조회
  useEffect(() => {
    if (!isLoaded || !userId) {
      return;
    }

    async function loadTasks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading tasks:', error);
          return;
        }

        setTasks(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [isLoaded, userId, supabase]);

  // 새 task 생성
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          name: taskName.trim(),
          completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return;
      }

      setTasks((prev) => [data, ...prev]);
      setTaskName('');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Task 완료 상태 토글
  async function handleToggleTask(id: number, completed: boolean) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !completed } : task
        )
      );
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Task 삭제
  async function handleDeleteTask(id: number) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (error) {
      console.error('Error:', error);
    }
  }

  if (!isLoaded) {
    return <div className="p-4">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="p-4">
        <p>Please sign in to view your tasks.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Tasks</h1>

      {/* Task 생성 폼 */}
      <form onSubmit={handleCreateTask} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter new task..."
            className="flex-1 px-4 py-2 border rounded-md"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Tasks 목록 */}
      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks found. Create your first task!
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleTask(task.id, task.completed)}
                className="w-5 h-5"
              />
              <span
                className={`flex-1 ${
                  task.completed ? 'line-through text-gray-500' : ''
                }`}
              >
                {task.name}
              </span>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

