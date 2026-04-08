'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Key, Plus, RefreshCw, Trash2, X, CheckCircle, AlertCircle, Copy, UserPlus } from 'lucide-react'
import { createAccessKey, getAccessKeys, renewAccessKey, cancelAccessKey, deleteAccessKey, assignKeyToTeacher } from '@/actions/admin-keys'
import { getTeachers } from '@/actions/admin'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type AccessKey = {
  id: string
  key: string
  teacherId: string | null
  teacher: { name: string; email: string } | null
  emailTarget?: string | null
  planType: string
  status: string
  price: number
  expiresAt: Date
  createdAt: Date
  usedAt: Date | null
}

export default function AdminKeysPageInner() {
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedKey, setSelectedKey] = useState<AccessKey | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [emailTarget, setEmailTarget] = useState('')
  const [planType, setPlanType] = useState('monthly')
  const [customDuration, setCustomDuration] = useState('')
  const [customDurationUnit, setCustomDurationUnit] = useState('minutes')
  const [customPrice, setCustomPrice] = useState('')
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadKeys()
    loadTeachers()
  }, [])

  async function loadKeys() {
    setLoading(true)
    try {
      const data = await getAccessKeys()
      setKeys(data)
    } catch (err) {
      console.error('Error loading keys:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadTeachers() {
    try {
      const data = await getTeachers()
      setTeachers(data)
    } catch (err) {
      console.error('Error loading teachers:', err)
    }
  }

  async function handleCreateKey() {
    setCreating(true)
    try {
      const formData = new FormData()
      formData.append('planType', planType)
      formData.append('emailTarget', emailTarget)
      if (planType === 'custom') {
        formData.append('customDuration', customDuration)
        formData.append('customDurationUnit', customDurationUnit)
        formData.append('customPrice', customPrice || '0')
      }
      const result = await createAccessKey(formData)
      if (result?.success) {
        setNewKey(result.key)
        setEmailTarget('')
        setCustomDuration('')
        setCustomPrice('')
        loadKeys()
      }
    } catch (err) {
      console.error('Error creating key:', err)
    } finally {
      setCreating(false)
    }
  }

  async function handleAssignKey() {
    if (!selectedKey || !selectedTeacher) return
    setAssigning(true)
    try {
      await assignKeyToTeacher(selectedKey.id, selectedTeacher)
      setShowAssignModal(false)
      setSelectedKey(null)
      setSelectedTeacher('')
      loadKeys()
    } catch (err) {
      console.error('Error assigning key:', err)
    } finally {
      setAssigning(false)
    }
  }

  async function handleRenewKey(keyId: string, days: number) {
    try {
      await renewAccessKey(keyId, days)
      loadKeys()
    } catch (err) {
      console.error('Error renewing key:', err)
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Tem certeza que deseja excluir esta chave?')) return
    try {
      await deleteAccessKey(keyId)
      loadKeys()
    } catch (err) {
      console.error('Error deleting key:', err)
    }
  }

  async function handleCancelKey(keyId: string) {
    try {
      await cancelAccessKey(keyId)
      loadKeys()
    } catch (err) {
      console.error('Error cancelling key:', err)
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(date: Date) {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-green-100 text-green-800', text: 'Ativa' },
      used: { bg: 'bg-blue-100 text-blue-800', text: 'Usada' },
      cancelled: { bg: 'bg-red-100 text-red-800', text: 'Cancelada' }
    }
    const badge = badges[status] || badges.active
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.text}</span>
  }

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      test: 'Teste',
      monthly: 'Mensal',
      yearly: 'Anual'
    }
    return labels[plan] || plan
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chaves de Acesso</h1>
          <p className="text-gray-600 mt-1">Gerencie as chaves de acesso dos professores</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Criar Chave
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Key className="w-16 h-16 mb-4" />
          <p className="text-lg">Nenhuma chave encontrada</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Criar primeira chave
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chave</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email Alvo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Professor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expira em</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{key.key}</code>
                        <button
                          onClick={() => copyKey(key.key)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPlanLabel(key.planType)} - R$ {key.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(key.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {key.emailTarget ? (
                        <span className="text-blue-600 font-medium">{key.emailTarget}</span>
                      ) : (
                        <span className="text-gray-400">Qualquer</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {key.teacher ? (
                        <div>
                          <div className="font-medium">{key.teacher.name}</div>
                          <div className="text-gray-500 text-xs">{key.teacher.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Não vinculada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(key.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        {key.status === 'active' && !key.teacherId && (
                          <button
                            onClick={() => {
                              setSelectedKey(key)
                              setShowAssignModal(true)
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Vincular a professor"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        )}
                        {key.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleRenewKey(key.id, 30)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Renovar 30 dias"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleCancelKey(key.id)}
                              className="p-1 text-yellow-600 hover:text-yellow-800"
                              title="Cancelar"
                            >
                              <AlertCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Criar Nova Chave</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {newKey ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Chave criada com sucesso!</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <code className="text-lg font-mono break-all">{newKey}</code>
                </div>
                <button
                  onClick={() => {
                    copyKey(newKey)
                    setNewKey(null)
                    setShowModal(false)
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copiar e Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Plano</label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="test">Teste (4 horas)</option>
                    <option value="monthly">Mensal - R$ 19,99</option>
                    <option value="yearly">Anual - R$ 179,88</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
                {planType === 'custom' && (
                  <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Duração</label>
                        <input
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(e.target.value)}
                          placeholder="5"
                          min="1"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                        <select
                          value={customDurationUnit}
                          onChange={(e) => setCustomDurationUnit(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Preço (R$)</label>
                      <input
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    {customDuration && (
                      <p className="text-xs text-gray-500">
                        Expira em: {customDuration} {customDurationUnit === 'minutes' ? 'minuto(s)' : customDurationUnit === 'hours' ? 'hora(s)' : 'dia(s)'}
                      </p>
                    )}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email do Professor (opcional)</label>
                  <select
                    value={emailTarget}
                    onChange={(e) => setEmailTarget(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Qualquer professor</option>
                    {teachers.filter(t => !t.accessKey?.length).map((teacher) => (
                      <option key={teacher.id} value={teacher.email}>
                        {teacher.name} - {teacher.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Criando...' : 'Criar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAssignModal && selectedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Vincular Chave</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Professor</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Selecione...</option>
                {teachers.filter(t => !t.accessKey?.length).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignKey}
                disabled={assigning || !selectedTeacher}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
