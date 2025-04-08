export interface Payload<T> {
    message: string;
    status: string;
    data: T;
}