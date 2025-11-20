"""
AI Coach Chat Interface for Training GUI
Provides conversational AI recommendations based on video analysis
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class AICoachChat:
    """
    Simplified AI Coach for Training GUI
    Can use OpenAI, local LLM, or fallback to rule-based
    """
    
    def __init__(self, model_type: str = "llama", api_key: Optional[str] = None):
        """
        Initialize AI Coach
        
        Args:
            model_type: "llama" (BEST! Open-source, offline), "deepseek", "openai", "local", or "fallback"
            api_key: API key for DeepSeek/OpenAI (if using API, not needed for LLaMA)
        """
        self.model_type = model_type
        self.api_key = api_key
        self.conversation_history = []
        self.llm = None
        
        if model_type == "llama":
            self._init_llama()
        elif model_type == "deepseek":
            self._init_deepseek()
        elif model_type == "openai":
            self._init_openai()
        elif model_type == "local":
            self._init_local_llm()
        # Fallback doesn't need initialization
    
    def _init_llama(self):
        """Initialize LLaMA 3.1 model (Open-source, offline, FREE!)"""
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            import torch
            
            # Use 8B model (smaller, faster) - can switch to 70B if you have enough RAM
            model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"
            
            logger.info(f"🚀 Loading LLaMA 3.1: {model_name}")
            logger.info("   This may take a few minutes on first run...")
            
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True
            )
            
            # Load model
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )
            
            if not torch.cuda.is_available():
                model = model.to("cpu")
            
            # Store both model and tokenizer
            self.llm = {
                "model": model,
                "tokenizer": tokenizer,
                "device": "cuda" if torch.cuda.is_available() else "cpu"
            }
            
            logger.info(f"✅ LLaMA 3.1 loaded successfully on {self.llm['device']}")
            logger.info("   🎉 100% Open-source, runs offline, completely FREE!")
            
        except ImportError:
            logger.warning("⚠️  Transformers not installed. Install with: pip install transformers torch accelerate")
            self.model_type = "fallback"
        except Exception as e:
            logger.warning(f"⚠️  LLaMA initialization failed: {e}")
            logger.warning("   Falling back to rule-based mode")
            self.model_type = "fallback"
    
    def _init_deepseek(self):
        """Initialize DeepSeek client (FREE/Cheap alternative!)"""
        try:
            import openai  # DeepSeek uses OpenAI-compatible API
            
            if not self.api_key:
                import os
                self.api_key = os.getenv("DEEPSEEK_API_KEY")
            
            if self.api_key:
                # DeepSeek uses OpenAI-compatible API
                self.llm = openai.OpenAI(
                    api_key=self.api_key,
                    base_url="https://api.deepseek.com"
                )
                logger.info("✅ DeepSeek client initialized (FREE/Cheap!)")
            else:
                logger.warning("⚠️  DeepSeek API key not found. Using fallback mode.")
                self.model_type = "fallback"
        except ImportError:
            logger.warning("⚠️  OpenAI package not installed. Using fallback mode.")
            self.model_type = "fallback"
        except Exception as e:
            logger.warning(f"⚠️  DeepSeek initialization failed: {e}. Using fallback mode.")
            self.model_type = "fallback"
    
    def _init_openai(self):
        """Initialize OpenAI client"""
        try:
            import openai
            if not self.api_key:
                import os
                self.api_key = os.getenv("OPENAI_API_KEY")
            
            if self.api_key:
                openai.api_key = self.api_key
                self.llm = openai
                logger.info("✅ OpenAI client initialized")
            else:
                logger.warning("⚠️  OpenAI API key not found. Using fallback mode.")
                self.model_type = "fallback"
        except ImportError:
            logger.warning("⚠️  OpenAI package not installed. Using fallback mode.")
            self.model_type = "fallback"
    
    def _init_local_llm(self):
        """Initialize local LLM"""
        try:
            from transformers import pipeline
            import torch
            
            # Use a small model
            model_id = "gpt2"  # Very small, fast model
            logger.info(f"Loading local LLM: {model_id}")
            
            self.llm = pipeline(
                "text-generation",
                model=model_id,
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("✅ Local LLM initialized")
        except Exception as e:
            logger.warning(f"⚠️  Local LLM failed: {e}. Using fallback mode.")
            self.model_type = "fallback"
    
    def chat(
        self,
        user_message: str,
        action_type: str,
        metrics: Dict,
        shot_outcome: Optional[Dict] = None
    ) -> str:
        """
        Chat with AI coach
        
        Args:
            user_message: User's question
            action_type: Detected action
            metrics: Performance metrics
            shot_outcome: Shot outcome if applicable
            
        Returns:
            AI coach response
        """
        # Build context
        context = self._build_context(action_type, metrics, shot_outcome)
        
        # Add to conversation
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Generate response
        if self.model_type == "llama" and self.llm:
            response = self._call_llama(user_message, context)
        elif self.model_type == "openai" and self.llm:
            response = self._call_openai(user_message, context)
        elif self.model_type == "local" and self.llm:
            response = self._call_local_llm(user_message, context)
        else:
            response = self._fallback_response(user_message, context)
        
        # Add to conversation
        self.conversation_history.append({
            "role": "assistant",
            "content": response
        })
        
        return response
    
    def _build_context(self, action_type: str, metrics: Dict, shot_outcome: Optional[Dict]) -> str:
        """Build context string"""
        context = f"""Basketball Performance Analysis:
- Action: {action_type}
- Jump Height: {metrics.get('jump_height', 0):.2f}m
- Movement Speed: {metrics.get('movement_speed', 0):.1f} m/s
- Form Score: {metrics.get('form_score', 0):.2f}/1.0
- Reaction Time: {metrics.get('reaction_time', 0):.2f}s
- Pose Stability: {metrics.get('pose_stability', 0):.2f}/1.0"""
        
        if shot_outcome and shot_outcome.get('outcome') != 'not_applicable':
            context += f"\n- Shot Outcome: {shot_outcome.get('outcome', 'unknown')}"
        
        return context
    
    def _call_llama(self, user_message: str, context: str) -> str:
        """Call LLaMA 3.1 model (Open-source, offline!)"""
        if self.llm is None or not isinstance(self.llm, dict):
            return "LLaMA model not initialized."
        
        try:
            import torch
            
            model = self.llm["model"]
            tokenizer = self.llm["tokenizer"]
            device = self.llm["device"]
            
            # Build prompt with context
            system_prompt = f"""You are an expert basketball coach. Analyze this performance data and answer questions:

{context}

Be specific, technical, and encouraging. Use basketball terminology."""
            
            # Format for LLaMA 3.1 Instruct
            formatted_prompt = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|>"
            
            # Add conversation history
            for msg in self.conversation_history[-5:]:  # Last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    formatted_prompt += f"<|start_header_id|>user<|end_header_id|>\n\n{content}<|eot_id|>"
                elif role == "assistant":
                    formatted_prompt += f"<|start_header_id|>assistant<|end_header_id|>\n\n{content}<|eot_id|>"
            
            # Add current user message
            formatted_prompt += f"<|start_header_id|>user<|end_header_id|>\n\n{user_message}<|eot_id|>"
            formatted_prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n"
            
            # Tokenize
            inputs = tokenizer(
                formatted_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=2048
            ).to(device)
            
            # Generate
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=300,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Decode response
            response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"LLaMA generation error: {e}")
            return self._fallback_response(user_message, context)
    
    def _call_deepseek(self, user_message: str, context: str) -> str:
        """Call DeepSeek API (FREE/Cheap!)"""
        try:
            system_prompt = f"""You are an expert basketball coach. Analyze this performance data and answer questions:

{context}

Be specific, technical, and encouraging. Use basketball terminology."""
            
            messages = [
                {"role": "system", "content": system_prompt}
            ] + self.conversation_history[-10:]  # Last 10 messages for context
            
            # DeepSeek uses OpenAI-compatible API
            response = self.llm.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                temperature=0.7,
                max_tokens=300
            )
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"DeepSeek error: {e}")
            return self._fallback_response(user_message, context)
    
    def _call_openai(self, user_message: str, context: str) -> str:
        """Call OpenAI API"""
        try:
            system_prompt = f"""You are an expert basketball coach. Analyze this performance data and answer questions:

{context}

Be specific, technical, and encouraging. Use basketball terminology."""
            
            messages = [
                {"role": "system", "content": system_prompt}
            ] + self.conversation_history[-10:]  # Last 10 messages for context
            
            # Try new API format first
            if hasattr(self.llm, 'chat'):
                response = self.llm.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=300
                )
            else:
                # Old API format
                response = self.llm.ChatCompletion.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=300
                )
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            return self._fallback_response(user_message, context)
    
    def _call_local_llm(self, user_message: str, context: str) -> str:
        """Call local LLM"""
        try:
            prompt = f"{context}\n\nQuestion: {user_message}\nAnswer:"
            response = self.llm(
                prompt,
                max_length=200,
                num_return_sequences=1,
                temperature=0.7
            )
            return response[0]['generated_text'].replace(prompt, "").strip()
        except Exception as e:
            logger.error(f"Local LLM error: {e}")
            return self._fallback_response(user_message, context)
    
    def _fallback_response(self, user_message: str, context: str) -> str:
        """Fallback rule-based responses"""
        msg_lower = user_message.lower()
        
        # Extract metrics from context
        metrics = {}
        for line in context.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower().replace(' ', '_')
                try:
                    if 'm' in value:
                        metrics[key] = float(value.replace('m', '').strip())
                    elif '/' in value:
                        metrics[key] = float(value.split('/')[0].strip())
                    else:
                        metrics[key] = float(value.strip())
                except:
                    pass
        
        # Answer common questions
        if 'how' in msg_lower and 'improve' in msg_lower:
            if metrics.get('form_score', 0) < 0.75:
                return "Your form score is below optimal. Focus on:\n1. Elbow angle (aim for 85-95°)\n2. Smooth release with follow-through\n3. Consistent shooting motion\n\nPractice 100 shots daily focusing on these fundamentals."
            else:
                return "Your form is good! To improve further:\n1. Increase consistency through repetition\n2. Work on release timing\n3. Practice game-speed scenarios\n\nConsider filming yourself to identify micro-adjustments."
        
        elif 'jump' in msg_lower or 'vertical' in msg_lower:
            jump = metrics.get('jump_height', 0)
            if jump < 0.60:
                return f"Your jump height is {jump:.2f}m. To improve:\n1. Plyometric exercises (box jumps, depth jumps)\n2. Strength training (squats, deadlifts)\n3. Jump rope for explosiveness\n\nAim for 0.65m+ for better performance."
            else:
                return f"Great jump height at {jump:.2f}m! To maintain:\n1. Continue plyometric training\n2. Focus on landing mechanics\n3. Rest adequately between sessions"
        
        elif 'speed' in msg_lower or 'fast' in msg_lower:
            speed = metrics.get('movement_speed', 0)
            if speed < 5.5:
                return f"Your speed is {speed:.1f} m/s. To improve:\n1. Sprint intervals (10x 40m)\n2. Agility ladder drills\n3. Resistance band training\n\nTarget: 6.0+ m/s for better court movement."
            else:
                return f"Excellent speed at {speed:.1f} m/s! Keep it up with:\n1. Regular sprint training\n2. Agility work\n3. Game-speed practice"
        
        elif 'form' in msg_lower or 'technique' in msg_lower:
            form = metrics.get('form_score', 0)
            if form < 0.75:
                return f"Form score: {form:.2f}/1.0. Key areas:\n1. Shooting: Elbow at 90°, smooth release\n2. Dribbling: Keep ball low, use fingertips\n3. Defense: Stay low, active hands\n\nPractice fundamentals daily."
            else:
                return f"Solid form at {form:.2f}/1.0! Refine:\n1. Consistency in every rep\n2. Game-speed execution\n3. Film review for micro-adjustments"
        
        elif 'what' in msg_lower and ('wrong' in msg_lower or 'bad' in msg_lower):
            issues = []
            if metrics.get('form_score', 0) < 0.75:
                issues.append("Form needs improvement")
            if metrics.get('jump_height', 0) < 0.60:
                issues.append("Jump height below average")
            if metrics.get('movement_speed', 0) < 5.5:
                issues.append("Movement speed could be faster")
            
            if issues:
                return f"Areas to focus on:\n" + "\n".join(f"- {issue}" for issue in issues) + "\n\nI can provide specific drills for each. What would you like to work on first?"
            else:
                return "Your performance looks solid! All metrics are in good ranges. Keep practicing to maintain consistency."
        
        else:
            return f"Based on your performance:\n{context}\n\nWhat specific aspect would you like to improve? I can help with:\n- Shooting form\n- Jump height\n- Movement speed\n- Reaction time\n- Overall technique\n\nJust ask me a question!"
    
    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = []
    
    def get_initial_analysis(self, action_type: str, metrics: Dict, shot_outcome: Optional[Dict] = None) -> str:
        """Get initial performance analysis"""
        context = self._build_context(action_type, metrics, shot_outcome)
        
        question = "Give me a comprehensive analysis of my performance. What are my strengths and what should I work on?"
        
        return self.chat(question, action_type, metrics, shot_outcome)

