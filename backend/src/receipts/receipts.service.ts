import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from './entities/receipt.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = '/uploads';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private receiptsRepository: Repository<Receipt>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<Receipt> {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only PDF, JPEG, and PNG files are allowed.`,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds the maximum limit of 10MB.`,
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    try {
      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Save receipt record to database
      const receipt = this.receiptsRepository.create({
        file_path: filePath,
        file_name: file.originalname,
        mime_type: file.mimetype,
      });

      return await this.receiptsRepository.save(receipt);
    } catch (error) {
      // Clean up file if database save fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new BadRequestException('Failed to upload file');
    }
  }

  async getFile(
    receiptId: string,
    userId: string,
  ): Promise<{ filePath: string; mimeType: string; fileName: string }> {
    const receipt = await this.receiptsRepository
      .createQueryBuilder('receipt')
      .innerJoin('expenses', 'expense', 'expense.receipt_id = receipt.id')
      .where('receipt.id = :receiptId', { receiptId })
      .andWhere('expense.user_id = :userId', { userId })
      .select(['receipt.id', 'receipt.file_path', 'receipt.mime_type', 'receipt.file_name'])
      .getRawOne();

    if (!receipt) {
      throw new NotFoundException('Receipt not found or access denied');
    }

    // Validate file exists
    if (!fs.existsSync(receipt.receipt_file_path)) {
      throw new NotFoundException('Receipt file not found on disk');
    }

    // Prevent directory traversal attacks
    const normalizedPath = path.normalize(receipt.receipt_file_path);
    if (!normalizedPath.startsWith(UPLOAD_DIR)) {
      throw new ForbiddenException('Access denied');
    }

    return {
      filePath: receipt.receipt_file_path,
      mimeType: receipt.receipt_mime_type,
      fileName: receipt.receipt_file_name,
    };
  }

  async deleteFile(receiptId: string): Promise<void> {
    const receipt = await this.receiptsRepository.findOne({
      where: { id: receiptId },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    try {
      // Delete file from filesystem
      if (fs.existsSync(receipt.file_path)) {
        fs.unlinkSync(receipt.file_path);
      }

      // Delete database record
      await this.receiptsRepository.remove(receipt);
    } catch (error) {
      throw new BadRequestException('Failed to delete receipt');
    }
  }
}
