

use axum::{
    body::{Body, Bytes},
    extract::Request,
};
use hyper::StatusCode;
mod test_utils;

use test_utils::{create_test_app, setup};
use tower::ServiceExt;

#[tokio::test]
async fn test_basic_put_cache() {
    setup();
    //GIVEN and app with a Redis cache
    let app = create_test_app().await;

    let test_key = "http-integration-key";
    let test_data = Bytes::from_static(b"hello via http");

    //WHEN
    // Upload data via PUT
    let req = Request::builder()
        .method("PUT")
        .uri(format!("/v1/cache/{test_key}"))
        .header("Content-Length", test_data.len())
        .body(Body::from(test_data.clone()))
        .unwrap();

    //THEN
    let response = app.clone().oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::ACCEPTED);
}

#[tokio::test]
async fn test_multiple_put_cache() {
    setup();
    //GIVEN and app with a Redis cache
    let app = create_test_app().await;
    let test_data = Bytes::from_static(b"hello via http");

    //WHEN
    // Upload data via PUT
    let req = Request::builder()
        .method("PUT")
        .uri(format!("/v1/cache/http-integration-key"))
        .header("Content-Length", test_data.len())
        .body(Body::from(test_data.clone()))
        .unwrap();
    let response1 = app.clone().oneshot(req).await.unwrap();

    let req = Request::builder()
        .method("PUT")
        .uri(format!("/v1/cache/http-integration-key-1"))
        .header("Content-Length", test_data.len())
        .body(Body::from(test_data.clone()))
        .unwrap();
    let response2 = app.oneshot(req).await.unwrap();

    //THEN
    assert_eq!(response1.status(), StatusCode::ACCEPTED);
    assert_eq!(response2.status(), StatusCode::ACCEPTED);
}

#[tokio::test]
async fn test_put_same_item_results_in_error() {
    setup();
    //GIVEN and app with a Redis cache
    let app = create_test_app().await;
    let test_data = Bytes::from_static(b"hello via http");

    //WHEN
    // Upload data via PUT
    let req = Request::builder()
        .method("PUT")
        .uri(format!("/v1/cache/http-integration-key"))
        .header("Content-Length", test_data.len())
        .body(Body::from(test_data.clone()))
        .unwrap();
    let response1 = app.clone().oneshot(req).await.unwrap();

    let req = Request::builder()
        .method("PUT")
        .uri(format!("/v1/cache/http-integration-key"))
        .header("Content-Length", test_data.len())
        .body(Body::from(test_data.clone()))
        .unwrap();
    let response2 = app.oneshot(req).await.unwrap();

    //THEN
    assert_eq!(response1.status(), StatusCode::ACCEPTED);
    assert_eq!(response2.status(), StatusCode::CONFLICT);
}
