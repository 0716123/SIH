<?php

namespace App\Http\Controllers;

use App\Models\Symptom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SymptomController extends Controller
{
    /**
     * Display a listing of symptoms
     */
    public function index(Request $request): JsonResponse
    {
        $query = Symptom::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $symptoms = $query->orderBy('category')->orderBy('name')->get();

        return $this->sendResponse($symptoms, 'Symptoms retrieved successfully.');
    }

    /**
     * Get distinct symptom categories
     */
    public function categories(): JsonResponse
    {
        $categories = Symptom::select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->pluck('category');

        return $this->sendResponse($categories, 'Symptom categories retrieved successfully.');
    }

    /**
     * Store a newly created symptom
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:150|unique:symptoms,name',
            'code'        => 'nullable|string|max:50|unique:symptoms,code',
            'description' => 'nullable|string',
            'category'    => 'nullable|string|max:100',
            'is_active'   => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $symptom = Symptom::create($validator->validated());

        return $this->sendResponse($symptom, 'Symptom created successfully.', 201);
    }

    /**
     * Display the specified symptom
     */
    public function show(int $id): JsonResponse
    {
        $symptom = Symptom::withCount('caseSymptoms')->find($id);

        if (!$symptom) {
            return $this->sendError('Symptom not found.');
        }

        return $this->sendResponse($symptom, 'Symptom details retrieved successfully.');
    }

    /**
     * Update the specified symptom
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $symptom = Symptom::find($id);

        if (!$symptom) {
            return $this->sendError('Symptom not found.');
        }

        $validator = Validator::make($request->all(), [
            'name'        => 'sometimes|required|string|max:150|unique:symptoms,name,' . $id,
            'code'        => 'nullable|string|max:50|unique:symptoms,code,' . $id,
            'description' => 'nullable|string',
            'category'    => 'nullable|string|max:100',
            'is_active'   => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $symptom->update($validator->validated());

        return $this->sendResponse($symptom, 'Symptom updated successfully.');
    }

    /**
     * Remove the specified symptom
     */
    public function destroy(int $id): JsonResponse
    {
        $symptom = Symptom::find($id);

        if (!$symptom) {
            return $this->sendError('Symptom not found.');
        }

        if ($symptom->caseSymptoms()->exists()) {
            return $this->sendError('Cannot delete symptom that is linked to existing case records.', [], 400);
        }

        $symptom->delete();

        return $this->sendResponse(null, 'Symptom deleted successfully.');
    }
}
