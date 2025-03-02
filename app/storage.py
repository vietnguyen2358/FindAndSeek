from datetime import datetime
from typing import Dict, List, Optional, Any
from .models import Case, CaseBase, CameraFootage, CameraFootageBase, AIAnalysis, SearchRadius, TimelineEvent

class Storage:
    def __init__(self):
        self._cases: Dict[int, Case] = {}
        self._camera_footage: Dict[int, CameraFootage] = {}
        self._current_case_id: int = 1
        self._current_footage_id: int = 1

    async def create_case(self, case_data: CaseBase) -> Case:
        case_id = self._current_case_id
        self._current_case_id += 1

        case = Case(
            **case_data.model_dump(),
            id=case_id,
            createdAt=datetime.now(),
            timeline=[],
            images=[],
            aiAnalysis=AIAnalysis(),
            searchRadius=SearchRadius(),
            lastSighting=None
        )
        self._cases[case_id] = case
        return case

    async def get_case(self, case_id: int) -> Optional[Case]:
        return self._cases.get(case_id)

    async def get_all_cases(self) -> List[Case]:
        return list(self._cases.values())

    async def update_case(self, case_id: int, case_data: Dict[str, Any]) -> Case:
        if case_id not in self._cases:
            raise ValueError("Case not found")
        
        current_case = self._cases[case_id]
        updated_data = current_case.model_dump()
        updated_data.update(case_data)
        
        updated_case = Case(**updated_data)
        self._cases[case_id] = updated_case
        return updated_case

    async def add_camera_footage(self, footage_data: CameraFootageBase) -> CameraFootage:
        footage_id = self._current_footage_id
        self._current_footage_id += 1

        footage = CameraFootage(
            **footage_data.model_dump(),
            id=footage_id
        )
        self._camera_footage[footage_id] = footage
        return footage

    async def get_case_footage(self, case_id: int) -> List[CameraFootage]:
        return [
            footage for footage in self._camera_footage.values()
            if footage.caseId == case_id
        ]

    async def update_case_ai_analysis(self, case_id: int, analysis: AIAnalysis) -> Case:
        if case_id not in self._cases:
            raise ValueError("Case not found")
        return await self.update_case(case_id, {"aiAnalysis": analysis.model_dump()})

    async def update_case_search_radius(self, case_id: int, search_radius: SearchRadius) -> Case:
        if case_id not in self._cases:
            raise ValueError("Case not found")
        return await self.update_case(case_id, {"searchRadius": search_radius.model_dump()})

    async def update_footage_analysis(self, footage_id: int, analysis: Dict[str, Any]) -> CameraFootage:
        if footage_id not in self._camera_footage:
            raise ValueError("Footage not found")
        
        current_footage = self._camera_footage[footage_id]
        updated_data = current_footage.model_dump()
        updated_data["aiAnalysis"] = analysis
        
        updated_footage = CameraFootage(**updated_data)
        self._camera_footage[footage_id] = updated_footage
        return updated_footage

    async def add_timeline_event(self, case_id: int, event: TimelineEvent) -> Case:
        if case_id not in self._cases:
            raise ValueError("Case not found")
        
        current_case = self._cases[case_id]
        timeline = current_case.timeline + [event]
        return await self.update_case(case_id, {"timeline": timeline})

# Create a global storage instance
storage = Storage() 