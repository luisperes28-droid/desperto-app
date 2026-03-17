import React, { useState, useEffect } from 'react';
import { HelpCircle, Save, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SecurityQuestion {
  id: number;
  question_text: string;
}

interface UserSecurityQuestion {
  questionId: number;
  answer: string;
}

interface SecurityQuestionsSetupProps {
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SecurityQuestionsSetup({ userId, onClose, onSuccess }: SecurityQuestionsSetupProps) {
  const [availableQuestions, setAvailableQuestions] = useState<SecurityQuestion[]>([]);
  const [userQuestions, setUserQuestions] = useState<UserSecurityQuestion[]>([
    { questionId: 0, answer: '' },
    { questionId: 0, answer: '' },
    { questionId: 0, answer: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadAvailableQuestions();
    loadUserQuestions();
  }, [userId]);

  const loadAvailableQuestions = async () => {
    try {
      const { data: questions, error } = await supabase
        .from('predefined_security_questions')
        .select('*')
        .order('question_text');

      if (error) throw error;
      setAvailableQuestions(questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Erro ao carregar perguntas de segurança');
    }
  };

  const loadUserQuestions = async () => {
    try {
      const { data: existingQuestions, error } = await supabase
        .from('security_questions')
        .select('question_id, predefined_security_questions!inner(question_text)')
        .eq('user_id', userId);

      if (error) throw error;

      if (existingQuestions && existingQuestions.length > 0) {
        const userQs = existingQuestions.map(eq => ({
          questionId: eq.question_id,
          answer: '' // Não carregar respostas por segurança
        }));
        
        // Preencher com questões vazias se necessário
        while (userQs.length < 3) {
          userQs.push({ questionId: 0, answer: '' });
        }
        
        setUserQuestions(userQs);
      }
    } catch (error) {
      console.error('Error loading user questions:', error);
    }
  };

  const handleQuestionChange = (index: number, questionId: number) => {
    setUserQuestions(prev => prev.map((uq, i) => 
      i === index ? { ...uq, questionId } : uq
    ));
  };

  const handleAnswerChange = (index: number, answer: string) => {
    setUserQuestions(prev => prev.map((uq, i) => 
      i === index ? { ...uq, answer } : uq
    ));
  };

  const hashAnswer = async (answer: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(answer.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSave = async () => {
    // Validar se todas as perguntas estão preenchidas
    const validQuestions = userQuestions.filter(uq => uq.questionId > 0 && uq.answer.trim());
    
    if (validQuestions.length < 3) {
      setError('Por favor, responda a pelo menos 3 perguntas de segurança');
      return;
    }

    // Verificar se não há perguntas duplicadas
    const questionIds = validQuestions.map(uq => uq.questionId);
    if (new Set(questionIds).size !== questionIds.length) {
      setError('Não pode escolher a mesma pergunta mais de uma vez');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Remover perguntas existentes
      await supabase
        .from('security_questions')
        .delete()
        .eq('user_id', userId);

      // Adicionar novas perguntas
      const questionsToInsert = await Promise.all(
        validQuestions.map(async (uq) => ({
          user_id: userId,
          question_id: uq.questionId,
          answer_hash: await hashAnswer(uq.answer)
        }))
      );

      const { error: insertError } = await supabase
        .from('security_questions')
        .insert(questionsToInsert);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error saving security questions:', error);
      setError('Erro ao guardar perguntas de segurança');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Perguntas de Segurança Configuradas!
          </h3>
          <p className="text-gray-600">
            As suas perguntas de segurança foram guardadas com sucesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Configurar Perguntas de Segurança</h2>
                <p className="text-gray-600 text-sm">Para recuperação de password alternativa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Importante</span>
            </div>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>• Escolha perguntas cujas respostas não mudam com o tempo</li>
              <li>• Use respostas que só você conhece</li>
              <li>• As respostas são sensíveis a maiúsculas/minúsculas</li>
              <li>• Estas perguntas podem ser usadas para recuperar a sua password</li>
            </ul>
          </div>

          <div className="space-y-6">
            {userQuestions.map((userQuestion, index) => (
              <div key={index} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pergunta {index + 1}
                  </label>
                  <select
                    value={userQuestion.questionId}
                    onChange={(e) => handleQuestionChange(index, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Selecione uma pergunta...</option>
                    {availableQuestions
                      .filter(q => !userQuestions.some((uq, i) => i !== index && uq.questionId === q.id))
                      .map((question) => (
                        <option key={question.id} value={question.id}>
                          {question.question_text}
                        </option>
                      ))}
                  </select>
                </div>

                {userQuestion.questionId > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resposta
                    </label>
                    <input
                      type="text"
                      value={userQuestion.answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="A sua resposta..."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || userQuestions.filter(uq => uq.questionId > 0 && uq.answer.trim()).length < 3}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}