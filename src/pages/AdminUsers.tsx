import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { UserRole, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Mail, Edit2, Loader2 } from 'lucide-react';
import { fbResetPassword } from '../services/firebaseService';

export const AdminUsers: React.FC = () => {
  const { users, units, addUser, updateUser, deleteUser } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [unitId, setUnitId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.USER);
  const [editUnitId, setEditUnitId] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await addUser({ 
          companyId: 'c1', 
          name, 
          email, 
          password,
          role, 
          unitId: role !== UserRole.ADMIN ? unitId : undefined,
          avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=random`
        });
        setName('');
        setEmail('');
        setPassword('');
        setRole(UserRole.USER);
        setUnitId('');
        alert('Usuário criado com sucesso!');
    } catch (error: any) {
        alert(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = async (userEmail: string) => {
    if (window.confirm(`Enviar email de redefinição de senha para ${userEmail}?`)) {
        try {
            await fbResetPassword(userEmail);
            alert('Email enviado com sucesso!');
        } catch (e: any) {
            alert('Erro ao enviar email: ' + e.message);
        }
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditUnitId(user.unitId || '');
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editRole !== UserRole.ADMIN && !editUnitId) {
       alert("É necessário selecionar uma unidade para usuários não administradores.");
       return;
    }

    updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        unitId: editRole !== UserRole.ADMIN ? editUnitId : undefined
    });
    
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Usuários do Sistema</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Função</th>
                    <th className="px-4 py-3">Unidade</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img src={user.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-xs">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : user.role === UserRole.LEADER ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {units.find(u => u.id === user.unitId)?.name || (user.role === UserRole.ADMIN ? 'Todas' : '-')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => openEditModal(user)}
                          title="Editar Dados"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleSendResetEmail(user.email)} 
                          title="Enviar Email de Senha"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Adicionar Usuário</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha Inicial</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" placeholder="Min. 6 caracteres" minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função</label>
                <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                   <option value={UserRole.USER}>Usuário Comum</option>
                   <option value={UserRole.LEADER}>Líder de Unidade</option>
                   <option value={UserRole.ADMIN}>Admin Geral</option>
                </select>
              </div>
              
              {role !== UserRole.ADMIN && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                  <select required value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Selecione...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Cadastrar</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal Edit User Details */}
      <Modal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        title="Editar Dados do Usuário"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
             <input required value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
             <input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função</label>
             <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                <option value={UserRole.USER}>Usuário Comum</option>
                <option value={UserRole.LEADER}>Líder de Unidade</option>
                <option value={UserRole.ADMIN}>Admin Geral</option>
             </select>
           </div>
           
           {editRole !== UserRole.ADMIN && (
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
               <select required value={editUnitId} onChange={e => setEditUnitId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                 <option value="">Selecione...</option>
                 {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
             </div>
           )}

           <div className="flex justify-end pt-4">
             <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} className="mr-2">Cancelar</Button>
             <Button type="submit">Salvar Alterações</Button>
           </div>
        </form>
      </Modal>
    </div>
  );
};