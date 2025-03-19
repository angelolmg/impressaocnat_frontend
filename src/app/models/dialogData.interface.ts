export interface DialogData {
	title?: string;
	message?: string;
	warning?: string;
	data?: any;
	positive_label?: string;
	negative_label?: string;
}

export interface FileProfile {
	pageCount: number;
	fileName: string;
}

export interface FileDownloadResponse {
	filename: string;
	data: Blob;
}