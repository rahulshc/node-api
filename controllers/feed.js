const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
let creator;
exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page||1;
    const perPage = 2;
    let totalItems;

    try{
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find().skip((currentPage -1)*perPage).limit(perPage);
        
        res.status(200).json({message: 'Post fetched', posts: posts, totalItems: totalItems});
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode=500;//because it is some server side error
        }
        next(err);
    }
   
   
    
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
    const imageUrl=req.file.path.replace("\\" ,"/");
    //console.log(imageUrl);
    const title=req.body.title;
    const content= req.body.content;

    const post = new Post({
        title: title,
        imageUrl: imageUrl,
        content: content, 
        creator: req.userId//mongoose will convert string to object id
    });

    post.save().then(result=>{
        //console.log(result);
        
        //201 means created the resource
        return User.findById(req.userId);
    })
    .then(user => {
        creator=user;
        user.posts.push(post);
        return user.save();
    })
    .then(result=> {
        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: {_id: creator._id, name: creator.name, }
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
        imageUrl=req.file.path.replace("\\" ,"/");
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

        if(post.creator.toString() !== req.userId){
            const  error = new Error('Not authorized');
            error.statusCode = 403;
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

exports.deletePost = (req, res, next) => {
    const postId=req.params.postId;

    Post.findById(postId)
    .then(post => {
        if(!post){
            const  error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;//this error will be catched by catch block where we call next
        }

        if(post.creator.toString() !== req.userId){
            const  error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;//this error will be catched by catch block where we call next
        }

        //check logged in user
        clearImage(post.imageUrl, err => {
            if(err) {
                next(err);
            }

            Post.findByIdAndRemove(postId)
            .then(result=> {
                return User.findById(req.userId);
            })
            .then(user=> {
                user.posts.pull(postId);
                return user.save();
            })
            .then(result=> {
                res.status(200).json({message: 'Deleted Post.'});
            })
            .catch(err=> {
                if(!err.statusCode){
                    err.statusCode=500;
                }
                next(err);
            })
        });

    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    })
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