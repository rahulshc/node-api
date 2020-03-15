const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const Post = require('../models/posts');

exports.getPosts = (req, res, next) => {
    Post.find()
    .then(posts=> {
        res.status(200).json({message: 'Post fetched', posts: posts});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    })
};

exports.createPost = (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode=422;

        throw error;
    }

    if(!req.file){
        const error = new Error('No Image Provided');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl=req.file.path.replace("\\" ,"/");;
    console.log(imageUrl);
    const title=req.body.title;
    const content= req.body.content;

    const post = new Post({
        title: title,
        imageUrl: imageUrl,
        content: content, 
        creator: {name: 'Rahul'}
    });

    post.save().then(result=>{
        //console.log(result);
        
        //201 means created the resource
        res.status(201).json({
        message: 'Post created successfully!',
        post: result
    });
    })
    .catch(err=> {
        if(!err.statusCode){
            err.statusCode=500;//because it is some server side error
        }
        next(err);
    });
    
};

exports.getPost= (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
    .then(post=> {
        if(!post){
            const  error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;//this error will be catched by catch block where we call next
        }
        res.status(200).json({message: 'Post fetched', post: post});
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    });
}

exports.updatePost = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode=422;

        throw error;
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl= req.body.image;

    if(req.file){
        imageUrl=req.file.path;
    }

    if(!imageUrl){
        const error = new Error('No Image Provided');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
    .then(post=> {
        if(!post){
            const  error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;//this error will be catched by catch block where we call next
        }
        if(imageUrl !== post.imageUrl){
           clearImage(post.imageUrl, err=> {
                if(err) 
                {
                    next(err);
                }

                else{
                    post.title=title;
                    post.imageUrl=imageUrl;
                    post.content=content;

                    post.save().then(result=> {
                        res.status(200).json({message: 'Post Updated', post: result});//200 means existing resource was updated
                    }).catch(err=> {
                        if(!err.statusCode){
                            err.statusCode=500;
                        }
                        next(err);
                    });;
                }
           });
        }

        
    })
    .catch(err=> {
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    });
}

//helper function
const clearImage = (filePath, cb) => {
//because we are inside controller we have to go one level up, _dirname is root directory in which app.js is existing
    filePath = path.join(__dirname, '..', filePath);
    //when new image uploaded clear the new image
    fs.unlink(filePath, err => {
        if(err){
            err.statusCode = 500;
        }

        return cb(err);
        
    });
}