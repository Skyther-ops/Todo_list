<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;
    protected $table = 'task';
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'image_path',
        'due_date',
        'priority',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
