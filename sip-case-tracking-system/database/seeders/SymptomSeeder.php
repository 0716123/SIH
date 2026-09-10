<?php

namespace Database\Seeders;

use App\Models\Symptom;
use Illuminate\Database\Seeder;

class SymptomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $symptoms = [
            // General Symptoms
            ['name' => 'High Fever', 'code' => 'SYM-GEN-01', 'category' => 'General', 'description' => 'Body temperature above 38.5 C / 101.3 F.'],
            ['name' => 'Fatigue & Lethargy', 'code' => 'SYM-GEN-02', 'category' => 'General', 'description' => 'Persistent lack of energy and general weakness.'],
            ['name' => 'Chills & Rigors', 'code' => 'SYM-GEN-03', 'category' => 'General', 'description' => 'Shivering feeling accompanied by sudden temperature changes.'],
            ['name' => 'Unexplained Weight Loss', 'code' => 'SYM-GEN-04', 'category' => 'General', 'description' => 'Noticeable drop in body weight without dieting.'],

            // Respiratory Symptoms
            ['name' => 'Persistent Dry Cough', 'code' => 'SYM-RESP-01', 'category' => 'Respiratory', 'description' => 'Irritating non-productive cough lasting > 1 week.'],
            ['name' => 'Productive Cough (Phlegm)', 'code' => 'SYM-RESP-02', 'category' => 'Respiratory', 'description' => 'Cough yielding yellow, green, or blood-streaked sputum.'],
            ['name' => 'Dyspnea / Shortness of Breath', 'code' => 'SYM-RESP-03', 'category' => 'Respiratory', 'description' => 'Difficulty breathing during rest or mild exertion.'],
            ['name' => 'Wheezing', 'code' => 'SYM-RESP-04', 'category' => 'Respiratory', 'description' => 'High-pitched whistling sound while breathing out.'],

            // Cardiovascular Symptoms
            ['name' => 'Acute Chest Pain', 'code' => 'SYM-CARD-01', 'category' => 'Cardiovascular', 'description' => 'Substernal pressure, tightness or squeezing radiating to left arm/jaw.'],
            ['name' => 'Palpitations', 'code' => 'SYM-CARD-02', 'category' => 'Cardiovascular', 'description' => 'Irregular, rapid, or fluttering heartbeat.'],
            ['name' => 'Peripheral Edema (Leg Swelling)', 'code' => 'SYM-CARD-03', 'category' => 'Cardiovascular', 'description' => 'Fluid accumulation in lower extremities.'],

            // Gastrointestinal
            ['name' => 'Nausea & Vomiting', 'code' => 'SYM-GI-01', 'category' => 'Gastrointestinal', 'description' => 'Queasiness and recurrent vomiting episodes.'],
            ['name' => 'Acute Abdominal Pain', 'code' => 'SYM-GI-02', 'category' => 'Gastrointestinal', 'description' => 'Cramping or localized sharp epigastric/hypogastric pain.'],
            ['name' => 'Watery Diarrhea', 'code' => 'SYM-GI-03', 'category' => 'Gastrointestinal', 'description' => 'Loose frequent stools (>3 episodes per 24 hours).'],
            ['name' => 'Jaundice (Yellowing)', 'code' => 'SYM-GI-04', 'category' => 'Gastrointestinal', 'description' => 'Yellow pigmentation of the skin and sclera.'],

            // Neurological
            ['name' => 'Severe Throbbing Headache', 'code' => 'SYM-NEUR-01', 'category' => 'Neurological', 'description' => 'Unilateral or global intense headache with photophobia.'],
            ['name' => 'Dizziness & Vertigo', 'code' => 'SYM-NEUR-02', 'category' => 'Neurological', 'description' => 'Feeling unsteady or sensation of room spinning.'],
            ['name' => 'Altered Mental Status / Confusion', 'code' => 'SYM-NEUR-03', 'category' => 'Neurological', 'description' => 'Disorientation regarding time, place, or identity.'],

            // ENT (Ear, Nose, Throat)
            ['name' => 'Sore Throat / Odynophagia', 'code' => 'SYM-ENT-01', 'category' => 'ENT', 'description' => 'Painful swallowing and pharyngeal inflammation.'],
            ['name' => 'Nasal Congestion & Rhinorrhea', 'code' => 'SYM-ENT-02', 'category' => 'ENT', 'description' => 'Runny nose and blocked nasal passages.'],
            ['name' => 'Anosmia (Loss of Smell)', 'code' => 'SYM-ENT-03', 'category' => 'ENT', 'description' => 'Partial or total inability to perceive odors.'],
        ];

        foreach ($symptoms as $item) {
            Symptom::firstOrCreate(
                ['code' => $item['code']],
                [
                    'name'        => $item['name'],
                    'category'    => $item['category'],
                    'description' => $item['description'],
                    'is_active'   => true,
                ]
            );
        }
    }
}
