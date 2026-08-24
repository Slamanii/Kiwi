import api from './index'

export const uploadApi = {
    uploadFile: (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        // relayed explicitly — some browsers/devices (notably iOS video capture) leave
        // the multipart part's own content-type blank or inconsistent
        formData.append('type', file.type || 'application/octet-stream')
        return api.post<{ url: string; size: number; fileName: string; type: string }>(
            '/upload/upload',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        )
    },
}
