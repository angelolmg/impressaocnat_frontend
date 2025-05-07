export interface DialogDataInput {
	title?: string;
	message?: string;
	warning?: string;
	data?: any;
	positive_label?: string;
	negative_label?: string;
	show_notification_option?: boolean;
}

export interface DialogDataResponse {
	confirmation: boolean;
	sendNotification: boolean;
}

export interface FileProfile {
	pageCount: number;
	fileName: string;
}

export interface FileDownloadResponse {
	filename: string;
	data: Blob;
}