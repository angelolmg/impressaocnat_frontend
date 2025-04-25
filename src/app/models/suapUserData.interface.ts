export interface SuapUserData {
	id: number;
	matricula: string;
	nome_usual: string;
	cpf: string;
	rg: string;
	filiacao: string[];
	data_nascimento: string;
	naturalidade: string;
	tipo_sanguineo: string;
	email: string;
	url_foto_75x100: string;
	url_foto_150x200: string;
	tipo_vinculo: string;
	vinculo: Affiliation;
}

export interface Affiliation {
	matricula: string;
	nome: string;
	setor_suap: string;
	setor_siape: string;
	jornada_trabalho: string;
	campus: string;
	cargo: string;
	funcao: string[];
	disciplina_ingresso: string;
	categoria: string;
	telefones_institucionais: string[];
	url_foto_75x100: string;
	curriculo_lattes: string;
}
