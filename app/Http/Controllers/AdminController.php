<?php

namespace App\Http\Controllers;


use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function store(Request $request) {
        if($request->user()->role !== 'admin'){
            return response()->json(['message' => 'You are not authorized to perform this action'], 403);

        }
        $validated = $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:admin,user',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($request->password),
            'role' => $validated['role'],
        ]);

        return response()->json(['message' => 'User created successfully'], 201);
    }
    public function index() {
        return response()->json(\App\Models\User::where('role', 'user')->get());
    }
}
