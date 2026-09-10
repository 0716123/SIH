<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('app:health', function () {
    $this->comment('SIP Case Tracking System is healthy.');
})->purpose('Check that the application console is available');