<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller{
   public function store(Request $request)
{
    $request->validate([
        'title' => 'required|string',
        'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        'due_date' => 'required'
    ]);

    $path = null;
    if ($request->hasFile('image')) {
        // Correctly stores image in storage/app/public/tasks
        $path = $request->file('image')->store('tasks', 'public');
    }

    $task = Task::create([
        'user_id' => Auth::id(), // Ties the task to the current user
        'title' => $request->title,
        'description' => $request->description,
        'image_path' => $path,
        'due_date' => $request->due_date,
        'status' => 'todo', // Add this default so it shows in your first column!
    ]);

    return response()->json($task, 201);
}
    public function index(Request $request){
        $userTasks = $request->user()->task()->latest()->get();
        return response()->json($userTasks);

    }
}
