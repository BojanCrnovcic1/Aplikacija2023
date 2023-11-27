import { Body, Controller, Delete, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { Article } from "src/entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import { diskStorage } from "multer";
import { StorageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "src/entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";
import * as  fileType  from "file-type";
import * as fs from "fs";
import * as sharp from "sharp";
import { EditArticleDto } from "src/dtos/article/edit.article.dto";
import { AllowToRoles } from "src/misc/allow.to.roles.description";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";
import { ArticleSearchDto } from "src/dtos/article/article.search.dto";

@Controller('api/article')
@Crud({
    model: {
        type: Article
    },
    params: {
        id: {
            field: 'articleId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join: {
            category: {
                eager: true
            },
            photos: {
                eager: true
            },
            articlePrices: {
                eager: true
            },
            articleFeatures: {
                eager: true
            },
            features: {
                eager: true
            }
        }
    },
    routes: {
        only: [
            "getManyBase",
            "getOneBase"
        ],
        getManyBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        },
        getOneBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        }
    }
})

export class ArticleController {
    constructor(
        public service: ArticleService,
        public photoService: PhotoService
        ) {}

    @Post('createFull')
    @AllowToRoles('administrator')
    @UseGuards(RoleCheckerGuard)
    createFullArticle(@Body() data: AddArticleDto) {
        return this.service.createFullArticle(data);
    }

    @Patch(':id')
    @AllowToRoles('administrator')
    @UseGuards(RoleCheckerGuard)
    editFullArticle(@Param('id') id: number,@Body() data: EditArticleDto) {
        return this.service.editFullArticle(id,data);
    }

    @Post(':id/uploadPhoto/')
    @AllowToRoles('administrator')
    @UseGuards(RoleCheckerGuard)
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: StorageConfig.photo.destination,
                filename: (req, file, callbeck) => {

                    let orginal: string = file.orginalname;
                    let normalized = orginal.replace(/\s+/g, '-');
                    let sada = new Date()
                    let datePart = '';
                    datePart += sada.getFullYear().toString();
                    datePart += (sada.getMonth() + 1).toString();
                    datePart += sada.getDate().toString();

                    let randomPart: string = new Array(10).fill(0)
                    .map(e => (Math.random() * 9).toFixed(0).toString())
                    .join('');

                    let fileName = datePart + '-' + randomPart + '-' + normalized;
                    fileName.toLowerCase();

                    callbeck(null,fileName);
                }
            }),
            fileFilter: (req, file, callbeck) => {
                if (!file.originalname.toLowerCase().match(/\.(jpg|png)˘$/)) {
                    req.fileFilterError = 'Bad file extension!'
                    callbeck(null, false);
                    return;
                }

                if (!file.mimetype.includes('jpeg') || file.mimetype.includes('png')) {
                    req.fileFilterError = 'Bad file content!'
                    callbeck(null, false);
                    return;
                }

                callbeck(null,true);
            },
            limits: {
                files: 1,
                fileSize: StorageConfig.photo.maxSize
            }
        })
    )
    
    async uploadPhoto(@Param('id') articleId: number, @UploadedFile() photo, @Req() req): Promise <ApiResponse | Photo> {
        if (req.fileFilterError) {
            return new ApiResponse('error',-4002, req.fileFilterError);
        }

        if (!photo) {
            return new ApiResponse('error', -4002, 'File not uploaded!')
        }

        const fileTypeResult = await fileType.fromFile(photo.path);
        if (!fileTypeResult) {
            fs.unlinkSync(photo.path);
            return new ApiResponse('error', -4002, 'Cannot detect file type!')
        }

        const realMimeType = fileTypeResult.mime;
        if (!realMimeType.includes('jpeg') || realMimeType.includes('png')) {
            fs.unlinkSync(photo.path);
            return new ApiResponse('error', -4002, 'Bad type contant!')
        }

        await this.createResizedImage(photo, StorageConfig.photo.risize.thumb);
        await this.createResizedImage(photo, StorageConfig.photo.risize.small);

        const newPhoto: Photo = new Photo()
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;

        const savedPhoto = await this.photoService.add(newPhoto);

        if (!savedPhoto) {
            return new ApiResponse('error', -4001)
        }

        return savedPhoto;
    }

    async createResizedImage(photo, resizeSettings) {
        const orginalFilePath = photo.path;
        const fileName = photo.filename;

        const destinationFilePath = StorageConfig.photo.destination +
                                    resizeSettings.directory + fileName;

        await sharp(orginalFilePath)
              .resize({
                fit: 'cover',
                width: resizeSettings.width,
                height: resizeSettings.height,
              })
              .toFile(destinationFilePath);                      
    }
    @Delete(':articleId/deletePhoto/:photoId')
    @AllowToRoles('administrator')
    @UseGuards(RoleCheckerGuard)
    public async deletePhoto(@Param('articleId') articleId: number, @Param('photoId') photoId: number) {
        const photo = await this.photoService.findOne({where: {articleId, photoId}, withDeleted: true});

        if (!photo) {
            return new ApiResponse('error', -4004, 'Photo not found!')
        }
        try {
        fs.unlinkSync(StorageConfig.photo.destination + photo.imagePath);
        fs.unlinkSync(StorageConfig.photo.destination + StorageConfig.photo.risize.thumb.directory + photo.imagePath);
        fs.unlinkSync(StorageConfig.photo.destination + StorageConfig.photo.risize.small.directory + photo.imagePath);
        } 
        catch (e) {}

        const deleteResult = await this.photoService.deleteById(photoId);

        if (deleteResult.affected === 0) {
            return new ApiResponse('error', -4004, 'Photo not found!')
        }
        
        return  new ApiResponse('ok', 0, 'One photo deleted!')
    }

    @Post('search')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator', 'user')
    async search(@Body() data: ArticleSearchDto): Promise<Article[]> {
        return await this.service.search(data);
    }
}