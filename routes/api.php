<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TaskController;

// 1. Public Route
Route::post('/login', [AuthController::class, 'login']);


// Change /task to /tasks to match your React fetch calls
Route::middleware('auth:sanctum')->group(function(){
    Route::get('/admin/users', [AdminController::class, 'index']);

    // 1. Fetching tasks (Fixes the Dashboard GET 404)
    Route::get('/tasks', [TaskController::class, 'index']);

    // 2. Creating tasks (Fixes the handleSubmit POST 404)
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
    Route::patch('/tasks/{id}', [TaskController::class, 'update']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);


    Route::post('/admin/create-user', [AdminController::class, 'store']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
