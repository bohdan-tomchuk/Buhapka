/**
 * Downloads a file from a Blob by creating a temporary object URL,
 * triggering a download via an anchor element, and cleaning up the URL.
 *
 * @param blob - The Blob to download
 * @param filename - The desired filename for the download
 */
export function downloadFile(blob: Blob, filename: string): void {
  // Create object URL from blob
  const url = window.URL.createObjectURL(blob)

  // Create anchor element and trigger download
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'

  // Append to body, click, and remove
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Revoke object URL to free memory
  window.URL.revokeObjectURL(url)
}
