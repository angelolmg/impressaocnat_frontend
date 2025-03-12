import { CopyInterface } from "./copy.interface";

export interface RequestInterface {
	id: number;
	creationDate: number; // Data de criação
	term: number; // Prazo
	username: string; // Nome do usuário
	registration: string; // Matrícula
	conclusionDate?: number; // Data de conclusão
    stale?: boolean; // Flag de obsolência/arquivado
    totalPageCount?: number; // Total de páginas na solicitação
    copies?: CopyInterface[]; // Arquivos anexados a solicitação
}

const DATE_2024_01_15 = new Date('2024-01-15T22:00:00.000Z').getTime();
const DATE_2024_02_20 = new Date('2024-02-20T12:00:00.000Z').getTime();
const DATE_2024_03_10 = new Date('2024-03-10T12:00:00.000Z').getTime();
const DATE_2024_04_05 = new Date('2024-04-05T12:00:00.000Z').getTime();
const DATE_2024_05_01 = new Date('2024-05-01T12:00:00.000Z').getTime();

export const REQUEST_MOCK_DATA: RequestInterface[] = [
    {
        id: 1,
        creationDate: DATE_2024_01_15,
        term: 30,
        username: 'Ana Souza',
        registration: '20230001',
    },
    {
        id: 2,
        creationDate: DATE_2024_02_20,
        term: 15,
        username: 'Pedro Silva',
        registration: '20230002',
        conclusionDate: DATE_2024_03_10,
    },
    {
        id: 3,
        creationDate: DATE_2024_03_10,
        term: 7,
        username: 'Maria Oliveira',
        registration: '20230003',
    },
    {
        id: 4,
        creationDate: DATE_2024_04_05,
        term: 20,
        username: 'João Pereira',
        registration: '20230004',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 5,
        creationDate: DATE_2024_01_15,
        term: 10,
        username: 'Carla Rodrigues',
        registration: '20230005',
    },
    {
        id: 6,
        creationDate: DATE_2024_02_20,
        term: 25,
        username: 'Lucas Santos',
        registration: '20230006',
        conclusionDate: DATE_2024_04_05,
    },
    {
        id: 7,
        creationDate: DATE_2024_03_10,
        term: 12,
        username: 'Fernanda Costa',
        registration: '20230007',
    },
     {
        id: 8,
        creationDate: DATE_2024_04_05,
        term: 18,
        username: 'Ricardo Almeida',
        registration: '20230008',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 9,
        creationDate: DATE_2024_01_15,
        term: 8,
        username: 'Patrícia Ferreira',
        registration: '20230009',
    },
    {
        id: 10,
        creationDate: DATE_2024_02_20,
        term: 30,
        username: 'Gustavo Lima',
        registration: '20230010',
        conclusionDate: DATE_2024_04_05,
    },
        {
        id: 11,
        creationDate: DATE_2024_03_10,
        term: 11,
        username: 'Amanda Gomes',
        registration: '20230011',
    },
    {
        id: 12,
        creationDate: DATE_2024_04_05,
        term: 22,
        username: 'Rafael Rodrigues',
        registration: '20230012',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 13,
        creationDate: DATE_2024_01_15,
        term: 5,
        username: 'Camila Pereira',
        registration: '20230013',
    },
    {
        id: 14,
        creationDate: DATE_2024_02_20,
        term: 17,
        username: 'Bruno Santos',
        registration: '20230014',
        conclusionDate: DATE_2024_03_10,
    },
    {
        id: 15,
        creationDate: DATE_2024_03_10,
        term: 28,
        username: 'Juliana Costa',
        registration: '20230015',
    },
        {
        id: 16,
        creationDate: DATE_2024_04_05,
        term: 9,
        username: 'Felipe Almeida',
        registration: '20230016',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 17,
        creationDate: DATE_2024_01_15,
        term: 21,
        username: 'Isabela Ferreira',
        registration: '20230017',
    },
    {
        id: 18,
        creationDate: DATE_2024_02_20,
        term: 14,
        username: 'Thiago Lima',
        registration: '20230018',
        conclusionDate: DATE_2024_04_05,
    },
    {
        id: 19,
        creationDate: DATE_2024_03_10,
        term: 29,
        username: 'Letícia Gomes',
        registration: '20230019',
    },
    {
        id: 1,
        creationDate: DATE_2024_01_15,
        term: 30,
        username: 'Ana Souza',
        registration: '20230001',
    },
    {
        id: 2,
        creationDate: DATE_2024_02_20,
        term: 15,
        username: 'Pedro Silva',
        registration: '20230002',
        conclusionDate: DATE_2024_03_10,
    },
    {
        id: 3,
        creationDate: DATE_2024_03_10,
        term: 7,
        username: 'Maria Oliveira',
        registration: '20230003',
    },
    {
        id: 4,
        creationDate: DATE_2024_04_05,
        term: 20,
        username: 'João Pereira',
        registration: '20230004',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 5,
        creationDate: DATE_2024_01_15,
        term: 10,
        username: 'Carla Rodrigues',
        registration: '20230005',
    },
    {
        id: 6,
        creationDate: DATE_2024_02_20,
        term: 25,
        username: 'Lucas Santos',
        registration: '20230006',
        conclusionDate: DATE_2024_04_05,
    },
    {
        id: 7,
        creationDate: DATE_2024_03_10,
        term: 12,
        username: 'Fernanda Costa',
        registration: '20230007',
    },
     {
        id: 8,
        creationDate: DATE_2024_04_05,
        term: 18,
        username: 'Ricardo Almeida',
        registration: '20230008',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 9,
        creationDate: DATE_2024_01_15,
        term: 8,
        username: 'Patrícia Ferreira',
        registration: '20230009',
    },
    {
        id: 10,
        creationDate: DATE_2024_02_20,
        term: 30,
        username: 'Gustavo Lima',
        registration: '20230010',
        conclusionDate: DATE_2024_04_05,
    },
        {
        id: 11,
        creationDate: DATE_2024_03_10,
        term: 11,
        username: 'Amanda Gomes',
        registration: '20230011',
    },
    {
        id: 12,
        creationDate: DATE_2024_04_05,
        term: 22,
        username: 'Rafael Rodrigues',
        registration: '20230012',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 13,
        creationDate: DATE_2024_01_15,
        term: 5,
        username: 'Camila Pereira',
        registration: '20230013',
    },
    {
        id: 14,
        creationDate: DATE_2024_02_20,
        term: 17,
        username: 'Bruno Santos',
        registration: '20230014',
        conclusionDate: DATE_2024_03_10,
    },
    {
        id: 15,
        creationDate: DATE_2024_03_10,
        term: 28,
        username: 'Juliana Costa',
        registration: '20230015',
    },
        {
        id: 16,
        creationDate: DATE_2024_04_05,
        term: 9,
        username: 'Felipe Almeida',
        registration: '20230016',
        conclusionDate: DATE_2024_05_01,
    },
    {
        id: 17,
        creationDate: DATE_2024_01_15,
        term: 21,
        username: 'Isabela Ferreira',
        registration: '20230017',
    },
    {
        id: 18,
        creationDate: DATE_2024_02_20,
        term: 14,
        username: 'Thiago Lima',
        registration: '20230018',
        conclusionDate: DATE_2024_04_05,
    },
    {
        id: 19,
        creationDate: DATE_2024_03_10,
        term: 29,
        username: 'Letícia Gomes',
        registration: '20230019',
    },
];