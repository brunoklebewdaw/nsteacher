export function exportToCSV(data: any[], filename: string, columns: { key: string; header: string }[]) {
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportStudentsToCSV(students: any[]) {
  exportToCSV(students, 'alunos', [
    { key: 'name', header: 'Nome' },
    { key: 'class', header: 'Turma' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Data de Cadastro' }
  ]);
}

export function exportGradesToCSV(grades: any[]) {
  exportToCSV(grades, 'notas', [
    { key: 'student', header: 'Aluno' },
    { key: 'class', header: 'Turma' },
    { key: 'subject', header: 'Disciplina' },
    { key: 'assessmentName', header: 'Avaliação' },
    { key: 'assessmentType', header: 'Tipo' },
    { key: 'value', header: 'Nota' },
    { key: 'weight', header: 'Peso' },
    { key: 'date', header: 'Data' }
  ]);
}

export function exportClassesToCSV(classes: any[]) {
  exportToCSV(classes, 'turmas', [
    { key: 'name', header: 'Nome' },
    { key: 'year', header: 'Ano' },
    { key: 'level', header: 'Nível' },
    { key: 'studentCount', header: 'Alunos' }
  ]);
}

export function exportLessonsToCSV(lessons: any[]) {
  exportToCSV(lessons, 'aulas', [
    { key: 'class', header: 'Turma' },
    { key: 'subject', header: 'Disciplina' },
    { key: 'theme', header: 'Tema' },
    { key: 'date', header: 'Data' },
    { key: 'status', header: 'Status' }
  ]);
}
