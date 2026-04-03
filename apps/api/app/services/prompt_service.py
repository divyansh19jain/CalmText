from app.prompts.pax_variants import PAX_PROMPTS, PromptVersion
from app.core.config import settings

class PromptService:
    @staticmethod
    def get_prompt(version: str = None) -> tuple[str, str]:
        selected_version = version or settings.default_prompt_version
        
        # Fallback to default if explicitly requested version does not exist
        if selected_version not in PAX_PROMPTS:
            selected_version = settings.default_prompt_version
            
        prompt_text = PAX_PROMPTS.get(selected_version)
        return selected_version, prompt_text
