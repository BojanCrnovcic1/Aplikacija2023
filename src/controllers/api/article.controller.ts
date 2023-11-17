import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { Article } from "entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import { diskStorage } from "multer";
import { StorageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";

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
    }
})

export class ArticleController {
    constructor(
        public service: ArticleService,
        public photoService: PhotoService
        ) {}

    @Post('createFull')
    createFullArticle(@Body() data: AddArticleDto) {
        return this.service.createFullArticle(data);
    }

    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: StorageConfig.photosDestination,
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
                if (!file.originalname.match(/\.(jpg|png)˘$/)) {
                    callbeck(new Error('Bad file extensions!'), false);
                    return;
                }

                if (!file.mimetype.includes('jpeg') || file.mimetype.includes('png')) {
                    callbeck(new Error('Bad file content!'), false);
                    return;
                }

                callbeck(null,true);
            },
            limits: {
                files: 1,
                fieldNameSize: StorageConfig.photoMaxFileSize
            }
        })
    )
    @Post(':id/uploadPhoto/')
    async uploadPhoto(@Param('id') articleId: number, @UploadedFile() photo): Promise <ApiResponse | Photo> {
        const newPhoto: Photo = new Photo()
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;

        const savedPhoto = await this.photoService.add(newPhoto);

        if (!savedPhoto) {
            return new ApiResponse('error', -4001)
        }

        return savedPhoto;
    }
}