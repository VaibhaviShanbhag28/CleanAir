import sys 
from config import settings 
print('Python:', sys.version) 
key = settings.GEMINI_API_KEY 
print('KEY:', key[:8] if key else 'EMPTY') 
import google.generativeai as genai 
print('genai: OK') 
