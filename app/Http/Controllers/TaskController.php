<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage; // Required for file handling

class TaskController extends Controller {

    public function index(Request $request) {
        $userTasks = $request->user()->tasks()->latest()->get();
        return response()->json($userTasks);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'due_date'    => 'required',
            'priority'    => 'required|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Handle Image Upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            // Save to 'storage/app/public/tasks'
            $imagePath = $request->file('image')->store('tasks', 'public');
        }

        $task = Task::create([
            'user_id'     => Auth::id(),
            'title'       => $validated['title'],
            'description' => $request->description,
            'due_date'    => $validated['due_date'],
            'priority'    => $validated['priority'],
            'status'      => 'todo',
            'is_pinned'   => false,
            'image_path'  => $imagePath // Save the path to database
        ]);

        return response()->json($task, 201);
    }

    public function update(Request $request, $id) {
        $task = $request->user()->tasks()->findOrFail($id);

        $request->validate([
            'title'       => 'sometimes|string',
            'description' => 'nullable|string',
            'status'      => 'sometimes|string',
            'priority'    => 'sometimes|string',
            'due_date'    => 'sometimes',
            'is_pinned'   => 'sometimes|boolean',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Get all data except the image file itself (we handle it manually)
        $data = $request->except(['image']);

        // Handle Image Replacement
        if ($request->hasFile('image')) {
            // 1. Delete the old image if it exists
            if ($task->image_path) {
                Storage::disk('public')->delete($task->image_path);
            }
            // 2. Store the new image
            $data['image_path'] = $request->file('image')->store('tasks', 'public');
        }

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(Request $request, $id) {
        $task = $request->user()->tasks()->findOrFail($id);

        // Clean up: Delete the image file from storage when task is deleted
        if ($task->image_path) {
            Storage::disk('public')->delete($task->image_path);
        }

        $task->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
