/*
 * Janus WebRTC Server v1.1.5
 * Copyright (C) 2014-2015 Meetecho S.r.l. <janus@meetecho.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var version = 1.2;
var server = null;
//  [수정] 서버 주소 설정 (jsflux janus server url)
// HTTP 배포 시 주소 변경 해야합니다 @_@
//server = "ws://janus.jsflux.co.kr/janus";
// server = "ws://janus.jsflux.co.kr:8088/janus";
// 근데 HTTP 로 배포시 화상회의 작동이 안될수도 있어써
// 가능하면 배포시에 HTTPS 로 해야한다고는 합니다...
server = "https://janus.jsflux.co.kr/janus";

var janus = null;
var sfutest = null;
var opaqueId = "videoroomtest-" + Janus.randomString(12);

var myroom = 1234; // Demo room
if (getQueryStringValue("room") !== "")
  myroom = parseInt(getQueryStringValue("room"));

//  [수정] 자동 접속 로직: myusername을 URL 파라미터 'display'에서 가져옵니다.
var myusername = getQueryStringValue("display");
var myrole = getQueryStringValue("role"); // role은 이제 UI에서만 사용됨
var myid = null;
var mystream = null;
var mypvtid = null;

var feeds = [];
var bitrateTimer = [];
var feedStreams = {};

var doSimulcast =
  getQueryStringValue("simulcast") === "yes" ||
  getQueryStringValue("simulcast") === "true";
var doSimulcast2 =
  getQueryStringValue("simulcast2") === "yes" ||
  getQueryStringValue("simulcast2") === "true";
var subscriber_mode =
  getQueryStringValue("subscriber-mode") === "yes" ||
  getQueryStringValue("subscriber-mode") === "true";

$(document).ready(function () {
  // Initialize the library (all console debuggers enabled)
  Janus.init({
    debug: "all",
    callback: function () {
      // Make sure the browser supports WebRTC
      if (!Janus.isWebrtcSupported()) {
        bootbox.alert("No WebRTC support... ");
        return;
      }

      // 🟢 [수정] 자동 접속 로직 시작
      if (myusername !== "" && myusername !== null) {
        // 이름 입력 필드에 이름을 표시하고, 입력 영역을 숨깁니다.
        $("#username").val(myusername).attr("disabled", true);
        $("#videojoin").hide(); // 로그인/참여 UI 전체 숨김
        $("#details").hide(); // 설명 영역 숨김

        // Create session
        janus = new Janus({
          server: server,
          success: function () {
            // Attach to VideoRoom plugin
            janus.attach({
              plugin: "janus.plugin.videoroom",
              opaqueId: opaqueId,
              success: function (pluginHandle) {
                // $("#details").remove();
                sfutest = pluginHandle;
                Janus.log(
                  "Plugin attached! (" +
                    sfutest.getPlugin() +
                    ", id=" +
                    sfutest.getId() +
                    ")"
                );
                Janus.log("  -- This is a publisher/manager");

                //  자동 참여 함수 호출
                if (myusername && myroom && myrole) {
                  autoJoinRoom(myroom, myusername, myrole);
                } else {
                  // Prepare the username registration (기존 수동 등록 로직 유지)
                  $("#videojoin").removeClass("hide").show();
                  $("#registernow").removeClass("hide").show();
                  $("#register").click(registerUsername);
                  $("#roomname").focus();
                }

                // Stop 버튼 활성화
                $("#start")
                  .removeAttr("disabled")
                  .html("Stop")
                  .off("click")
                  .click(function () {
                    $(this).attr("disabled", true);
                    janus.destroy();
                  });

                // roomList();
              },
              error: function (error) {
                Janus.error("  -- Error attaching plugin...", error);
                bootbox.alert("Error attaching plugin... " + error);
              },
              consentDialog: function (on) {
                Janus.debug(
                  "Consent dialog should be " + (on ? "on" : "off") + " now"
                );
                if (on) {
                  // Darken screen and show hint
                  $.blockUI({
                    message: '<div><img src="up_arrow.png"/></div>',
                    css: {
                      border: "none",
                      padding: "15px",
                      backgroundColor: "transparent",
                      color: "#aaa",
                      top: "10px",
                      left: navigator.mozGetUserMedia ? "-100px" : "300px",
                    },
                  });
                } else {
                  // Restore screen
                  $.unblockUI();
                }
              },
              iceState: function (state) {
                Janus.log("ICE state changed to " + state);
              },
              mediaState: function (medium, on) {
                Janus.log(
                  "Janus " +
                    (on ? "started" : "stopped") +
                    " receiving our " +
                    medium
                );
              },
              webrtcState: function (on) {
                Janus.log(
                  "Janus says our WebRTC PeerConnection is " +
                    (on ? "up" : "down") +
                    " now"
                );
                $("#videolocal").parent().parent().unblock();
                if (!on) return;
                $("#publish").remove();
                // This controls allows us to override the global room bitrate cap
                $("#bitrate").parent().parent().removeClass("hide").show();
                $("#bitrate a").click(function () {
                  var id = $(this).attr("id");
                  var bitrate = parseInt(id) * 1000;
                  if (bitrate === 0) {
                    Janus.log("Not limiting bandwidth via REMB");
                  } else {
                    Janus.log("Capping bandwidth to " + bitrate + " via REMB");
                  }
                  $("#bitrateset")
                    .html($(this).html() + '<span class="caret"></span>')
                    .parent()
                    .removeClass("open");
                  sfutest.send({
                    message: { request: "configure", bitrate: bitrate },
                  });
                  return false;
                });
              },
              onmessage: function (msg, jsep) {
                Janus.debug(" ::: Got a message (publisher) :::", msg);
                var event = msg["videoroom"];
                Janus.debug("Event: " + event);
                if (event) {
                  if (event === "joined") {
                    // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                    myid = msg["id"];
                    mypvtid = msg["private_id"];
                    Janus.log(
                      "Successfully joined room " +
                        msg["room"] +
                        " with ID " +
                        myid
                    );
                    $("#videojoin").hide(); // 참여 UI 숨김
                    $("#videos").removeClass("hide").show();
                    // 🟢 [FIX] 양방향 통신을 위해 모든 역할이 자신의 피드를 게시합니다.
                    publishOwnFeed(true);
                    Janus.log("Joined as Publisher. Publishing feed.");
                    // Any new feed to attach to?
                    if (msg["publishers"]) {
                      var list = msg["publishers"];
                      Janus.debug(
                        "Got a list of available publishers/feeds:",
                        list
                      );
                      for (var f in list) {
                        var id = list[f]["id"];
                        var display = list[f]["display"];
                        var audio = list[f]["audio_codec"];
                        var video = list[f]["video_codec"];
                        Janus.debug(
                          "  >> [" +
                            id +
                            "] " +
                            display +
                            " (audio: " +
                            audio +
                            ", video: " +
                            video +
                            ")"
                        );
                        // 🔴 [최종 FIX] 자기 자신을 구독하지 않고, 이미 구독한 피드를 다시 구독하지 않습니다.
                        if (id && id !== myid && findRemoteFeed(id) === null) {
                          newRemoteFeed(id, display, audio, video);
                        }
                      }
                    }
                  } else if (event === "destroyed") {
                    // The room has been destroyed
                    Janus.warn("The room has been destroyed!");
                    bootbox.alert("The room has been destroyed", function () {
                      window.location.reload();
                    });
                  } else if (event === "event") {
                    // Any new feed to attach to?
                    if (msg["publishers"]) {
                      var list = msg["publishers"];
                      Janus.debug(
                        "Got a list of available publishers/feeds:",
                        list
                      );
                      for (var f in list) {
                        var id = list[f]["id"];
                        var display = list[f]["display"];
                        var audio = list[f]["audio_codec"];
                        var video = list[f]["video_codec"];
                        Janus.debug(
                          "  >> [" +
                            id +
                            "] " +
                            display +
                            " (audio: " +
                            audio +
                            ", video: " +
                            video +
                            ")"
                        );
                        // 🔴 [최종 FIX] 자기 자신을 구독하지 않고, 이미 구독한 피드를 다시 구독하지 않습니다.
                        if (id && id !== myid && findRemoteFeed(id) === null) {
                          newRemoteFeed(id, display, audio, video);
                        }
                      }
                    } else if (msg["leaving"]) {
                      // One of the publishers has gone away?
                      var leaving = msg["leaving"];
                      Janus.log("Publisher left: " + leaving);
                      var remoteFeed = null;
                      for (var i = 1; i < 6; i++) {
                        if (feeds[i] && feeds[i].rfid == leaving) {
                          remoteFeed = feeds[i];
                          break;
                        }
                      }
                      if (remoteFeed != null) {
                        Janus.debug(
                          "Feed " +
                            remoteFeed.rfid +
                            " (" +
                            remoteFeed.rfdisplay +
                            ") has left the room, detaching"
                        );
                        $("#remote" + remoteFeed.rfindex)
                          .empty()
                          .hide();
                        $("#videoremote" + remoteFeed.rfindex).empty();
                        feeds[remoteFeed.rfindex] = null;
                        remoteFeed.detach();
                        delete feedStreams[remoteFeed.rfid]; // 🟢 [추가] feedStreams 정리
                      }
                    } else if (msg["unpublished"]) {
                      // One of the publishers has unpublished?
                      var unpublished = msg["unpublished"];
                      Janus.log("Publisher left: " + unpublished);
                      if (unpublished === "ok") {
                        // That's us
                        sfutest.hangup();
                        return;
                      }
                      var remoteFeed = null;
                      for (var i = 1; i < 6; i++) {
                        if (feeds[i] && feeds[i].rfid == unpublished) {
                          remoteFeed = feeds[i];
                          break;
                        }
                      }
                      if (remoteFeed != null) {
                        Janus.debug(
                          "Feed " +
                            remoteFeed.rfid +
                            " (" +
                            remoteFeed.rfdisplay +
                            ") has left the room, detaching"
                        );
                        $("#remote" + remoteFeed.rfindex)
                          .empty()
                          .hide();
                        $("#videoremote" + remoteFeed.rfindex).empty();
                        feeds[remoteFeed.rfindex] = null;
                        remoteFeed.detach();
                        delete feedStreams[remoteFeed.rfid];
                      }
                    } else if (msg["error"]) {
                      if (
                        msg["error_code"] === 429 &&
                        msg["error"] === "Missing mandatory element (feed)"
                      ) {
                        Janus.warn(
                          "Ignoring common subscriber error: " + msg["error"]
                        );
                        return;
                      }
                      bootbox.alert(msg["error"]);
                    }
                  }
                }
                if (jsep) {
                  Janus.debug("Handling SDP as well...", jsep);
                  sfutest.handleRemoteJsep({ jsep: jsep });
                  // Check if any of the media we wanted to publish has
                  // been rejected (e.g., wrong or unsupported codec)
                  var substream = $("#substream").val();
                  var temporal = $("#temporal").val();
                  var audio = msg["audio_codec"]; // 🟢 [수정] 오디오 코덱을 확인
                  if (
                    mystream &&
                    mystream.getAudioTracks() &&
                    mystream.getAudioTracks().length > 0 &&
                    !audio
                  ) {
                    // Audio has been rejected
                    toastr.warning(
                      "Our audio stream has been rejected, viewers won't hear us"
                    );
                  }
                  var video = msg["video_codec"];
                  if (
                    mystream &&
                    mystream.getVideoTracks() &&
                    mystream.getVideoTracks().length > 0 &&
                    !video
                  ) {
                    // Video has been rejected
                    toastr.warning(
                      "Our video stream has been rejected, viewers won't see us"
                    );
                    // Hide the webcam video
                    $("#myvideo").hide();
                    $("#videolocal").append(
                      '<div class="no-video-container">' +
                        '<i class="fa fa-video-camera fa-5 no-video-icon" style="height: 100%;"></i>' +
                        '<span class="no-video-text" style="font-size: 16px;">Video rejected, no webcam</span>' +
                        "</div>"
                    );
                  }
                  // Check if we need to configure screen sharing (for publishers)
                  if (substream !== "" || temporal !== "") {
                    var body = {
                      request: "configure",
                      substream: substream,
                      temporal: temporal,
                    };
                    sfutest.send({ message: body });
                  }
                }
              },
              onlocalstream: function (stream) {
                Janus.debug(" ::: Got a local stream :::", stream);
                mystream = stream;
                $("#videojoin").hide();
                $("#videos").removeClass("hide").show();
                if ($("#myvideo").length === 0) {
                  $("#videolocal").append(
                    '<video class="rounded centered" id="myvideo" width="100%" height="100%" autoplay playsinline muted="muted"/>'
                  );
                  // Add a 'mute' button
                  $("#videolocal").append(
                    '<button class="btn btn-warning btn-xs" id="mute" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;">음소거</button>'
                  );
                  $("#mute").click(toggleMute);
                  // Add an 'unpublish' button
                  $("#videolocal").append(
                    '<button class="btn btn-warning btn-xs" id="unpublish" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;">화면중지</button>'
                  );
                  $("#unpublish").click(unpublishOwnFeed);
                }
                $("#publisher").removeClass("hide").html(myusername).show();
                Janus.attachMediaStream($("#myvideo").get(0), stream);
                $("#myvideo").get(0).muted = "muted";
                if (
                  sfutest.webrtcStuff.pc.iceConnectionState !== "completed" &&
                  sfutest.webrtcStuff.pc.iceConnectionState !== "connected"
                ) {
                  $("#videolocal")
                    .parent()
                    .parent()
                    .block({
                      message: "<b>Publishing...</b>",
                      css: {
                        border: "none",
                        backgroundColor: "transparent",
                        color: "white",
                      },
                    });
                }
                var videoTracks = stream.getVideoTracks();
                if (!videoTracks || videoTracks.length === 0) {
                  // No webcam
                  $("#myvideo").hide();
                  if ($("#videolocal .no-video-container").length === 0) {
                    $("#videolocal").append(
                      '<div class="no-video-container">' +
                        '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                        '<span class="no-video-text">No webcam available</span>' +
                        "</div>"
                    );
                  }
                } else {
                  $("#videolocal .no-video-container").remove();
                  $("#myvideo").removeClass("hide").show();
                }
              },
              onremotestream: function (stream) {
                // The publisher stream is sendonly, we don't expect anything here
              },
              oncleanup: function () {
                Janus.log(
                  " ::: Got a cleanup notification: we are unpublished now :::"
                );
                mystream = null;
                $("#videolocal").html(
                  '<button id="publish" class="btn btn-primary">화면 송출</button>'
                );
                $("#publish").click(function () {
                  publishOwnFeed(true);
                });
                $("#videolocal").parent().parent().unblock();
                $("#bitrate").parent().parent().addClass("hide");
                $("#bitrate a").unbind("click");
              },
            });
          },
          error: function (error) {
            Janus.error(error);
            bootbox.alert(error, function () {
              window.location.reload();
            });
          },
          destroyed: function () {
            window.location.reload();
          },
        });
      } else {
        // 사용자 이름이 URL에 없는 경우, 수동 접속 UI 표시 (기존 동작 유지)
        $("#username").focus();
        $("#start")
          .removeAttr("disabled")
          .click(function () {
            $(this).attr("disabled", true);
            // Make sure the browser supports WebRTC
            if (!Janus.isWebrtcSupported()) {
              bootbox.alert("No WebRTC support... ");
              return;
            }
            // Create session
            janus = new Janus({
              server: server,
              success: function () {
                // Attach to VideoRoom plugin
                janus.attach({
                  plugin: "janus.plugin.videoroom",
                  opaqueId: opaqueId,
                  success: function (pluginHandle) {
                    sfutest = pluginHandle;
                    Janus.log(
                      "Plugin attached! (" +
                        sfutest.getPlugin() +
                        ", id=" +
                        sfutest.getId() +
                        ")"
                    );
                    Janus.log("  -- This is a publisher/manager");
                    // Prepare the username registration
                    $("#videojoin").removeClass("hide").show();
                    $("#start")
                      .removeAttr("disabled")
                      .html("Stop")
                      .off("click")
                      .click(function () {
                        $(this).attr("disabled", true);
                        janus.destroy();
                      });
                  },
                  error: function (error) {
                    Janus.error("  -- Error attaching plugin...", error);
                    bootbox.alert("Error attaching plugin... " + error);
                  },
                  consentDialog: function (on) {
                    Janus.debug(
                      "Consent dialog should be " + (on ? "on" : "off") + " now"
                    );
                    if (on) {
                      // Darken screen and show hint
                      $.blockUI({
                        message: '<div><img src="up_arrow.png"/></div>',
                        css: {
                          border: "none",
                          padding: "15px",
                          backgroundColor: "transparent",
                          color: "#aaa",
                          top: "10px",
                          left: navigator.mozGetUserMedia ? "-100px" : "300px",
                        },
                      });
                    } else {
                      // Restore screen
                      $.unblockUI();
                    }
                  },
                  iceState: function (state) {
                    Janus.log("ICE state changed to " + state);
                  },
                  mediaState: function (medium, on) {
                    Janus.log(
                      "Janus " +
                        (on ? "started" : "stopped") +
                        " receiving our " +
                        medium
                    );
                  },
                  webrtcState: function (on) {
                    Janus.log(
                      "Janus says our WebRTC PeerConnection is " +
                        (on ? "up" : "down") +
                        " now"
                    );
                    $("#videolocal").parent().parent().unblock();
                    if (!on) return;
                    $("#publish").remove();
                    // This controls allows us to override the global room bitrate cap
                    $("#bitrate").parent().parent().removeClass("hide").show();
                    $("#bitrate a").click(function () {
                      var id = $(this).attr("id");
                      var bitrate = parseInt(id) * 1000;
                      if (bitrate === 0) {
                        Janus.log("Not limiting bandwidth via REMB");
                      } else {
                        Janus.log(
                          "Capping bandwidth to " + bitrate + " via REMB"
                        );
                      }
                      $("#bitrateset")
                        .html($(this).html() + '<span class="caret"></span>')
                        .parent()
                        .removeClass("open");
                      sfutest.send({
                        message: { request: "configure", bitrate: bitrate },
                      });
                      return false;
                    });
                  },
                  onmessage: function (msg, jsep) {
                    Janus.debug(" ::: Got a message (publisher) :::", msg);
                    var event = msg["videoroom"];
                    Janus.debug("Event: " + event);
                    if (event) {
                      if (event === "joined") {
                        // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                        myid = msg["id"];
                        mypvtid = msg["private_id"];
                        Janus.log(
                          "Successfully joined room " +
                            msg["room"] +
                            " with ID " +
                            myid
                        );
                        if (subscriber_mode) {
                          $("#videojoin").hide();
                          $("#videos").removeClass("hide").show();
                        } else {
                          publishOwnFeed(true);
                        }
                        // Any new feed to attach to?
                        if (msg["publishers"]) {
                          var list = msg["publishers"];
                          Janus.debug(
                            "Got a list of available publishers/feeds:",
                            list
                          );
                          for (var f in list) {
                            var id = list[f]["id"];
                            var display = list[f]["display"];
                            var audio = list[f]["audio_codec"];
                            var video = list[f]["video_codec"];
                            Janus.debug(
                              "  >> [" +
                                id +
                                "] " +
                                display +
                                " (audio: " +
                                audio +
                                ", video: " +
                                video +
                                ")"
                            );
                            // 🔴 [최종 FIX] 자기 자신을 구독하지 않고, 이미 구독한 피드를 다시 구독하지 않습니다.
                            if (
                              id &&
                              id !== myid &&
                              findRemoteFeed(id) === null
                            ) {
                              newRemoteFeed(id, display, audio, video);
                            }
                          }
                        }
                      } else if (event === "destroyed") {
                        // The room has been destroyed
                        Janus.warn("The room has been destroyed!");
                        bootbox.alert(
                          "The room has been destroyed",
                          function () {
                            window.location.reload();
                          }
                        );
                      } else if (event === "event") {
                        // Any new feed to attach to?
                        if (msg["publishers"]) {
                          var list = msg["publishers"];
                          Janus.debug(
                            "Got a list of available publishers/feeds:",
                            list
                          );
                          for (var f in list) {
                            var id = list[f]["id"];
                            var display = list[f]["display"];
                            var audio = list[f]["audio_codec"];
                            var video = list[f]["video_codec"];
                            Janus.debug(
                              "  >> [" +
                                id +
                                "] " +
                                display +
                                " (audio: " +
                                audio +
                                ", video: " +
                                video +
                                ")"
                            );
                            // 🔴 [최종 FIX] 자기 자신을 구독하지 않고, 이미 구독한 피드를 다시 구독하지 않습니다.
                            if (
                              id &&
                              id !== myid &&
                              findRemoteFeed(id) === null
                            ) {
                              newRemoteFeed(id, display, audio, video);
                            }
                          }
                        } else if (msg["leaving"]) {
                          // One of the publishers has gone away?
                          var leaving = msg["leaving"];
                          Janus.log("Publisher left: " + leaving);
                          var remoteFeed = null;
                          for (var i = 1; i < 6; i++) {
                            if (feeds[i] && feeds[i].rfid == leaving) {
                              remoteFeed = feeds[i];
                              break;
                            }
                          }
                          if (remoteFeed != null) {
                            Janus.debug(
                              "Feed " +
                                remoteFeed.rfid +
                                " (" +
                                remoteFeed.rfdisplay +
                                ") has left the room, detaching"
                            );
                            $("#remote" + remoteFeed.rfindex)
                              .empty()
                              .hide();
                            $("#videoremote" + remoteFeed.rfindex).empty();
                            feeds[remoteFeed.rfindex] = null;
                            remoteFeed.detach();
                            delete feedStreams[remoteFeed.rfid];
                          }
                        } else if (msg["unpublished"]) {
                          // One of the publishers has unpublished?
                          var unpublished = msg["unpublished"];
                          Janus.log("Publisher left: " + unpublished);
                          if (unpublished === "ok") {
                            // That's us
                            sfutest.hangup();
                            return;
                          }
                          var remoteFeed = null;
                          for (var i = 1; i < 6; i++) {
                            if (feeds[i] && feeds[i].rfid == unpublished) {
                              remoteFeed = feeds[i];
                              break;
                            }
                          }
                          if (remoteFeed != null) {
                            Janus.debug(
                              "Feed " +
                                remoteFeed.rfid +
                                " (" +
                                remoteFeed.rfdisplay +
                                ") has left the room, detaching"
                            );
                            $("#remote" + remoteFeed.rfindex)
                              .empty()
                              .hide();
                            $("#videoremote" + remoteFeed.rfindex).empty();
                            feeds[remoteFeed.rfindex] = null;
                            remoteFeed.detach();
                            delete feedStreams[remoteFeed.rfid];
                          }
                        } else if (msg["error"]) {
                          if (msg["error_code"] === 426) {
                            // This is a "no such room" error: give a more meaningful description
                            bootbox.alert(
                              "<p>Apparently room <code>" +
                                myroom +
                                "</code> (the one this demo uses as a test room) " +
                                "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
                                "configuration file? If not, make sure you copy the details of room <code>" +
                                myroom +
                                "</code> " +
                                "from that sample in your current configuration file, then restart Janus and try again."
                            );
                          } else {
                            bootbox.alert(msg["error"]);
                          }
                        }
                      }
                    }
                    if (jsep) {
                      Janus.debug("Handling SDP as well...", jsep);
                      sfutest.handleRemoteJsep({ jsep: jsep });
                      // Check if any of the media we wanted to publish has
                      // been rejected (e.g., wrong or unsupported codec)
                      var audio = msg["audio_codec"];
                      if (
                        mystream &&
                        mystream.getAudioTracks() &&
                        mystream.getAudioTracks().length > 0 &&
                        !audio
                      ) {
                        // Audio has been rejected
                        toastr.warning(
                          "Our audio stream has been rejected, viewers won't hear us"
                        );
                      }
                      var video = msg["video_codec"];
                      if (
                        mystream &&
                        mystream.getVideoTracks() &&
                        mystream.getVideoTracks().length > 0 &&
                        !video
                      ) {
                        // Video has been rejected
                        toastr.warning(
                          "Our video stream has been rejected, viewers won't see us"
                        );
                        // Hide the webcam video
                        $("#myvideo").hide();
                        $("#videolocal").append(
                          '<div class="no-video-container">' +
                            '<i class="fa fa-video-camera fa-5 no-video-icon" style="height: 100%;"></i>' +
                            '<span class="no-video-text" style="font-size: 16px;">Video rejected, no webcam</span>' +
                            "</div>"
                        );
                      }
                    }
                  },
                  onlocalstream: function (stream) {
                    Janus.debug(" ::: Got a local stream :::", stream);
                    mystream = stream;
                    $("#videojoin").hide();
                    $("#videos").removeClass("hide").show();
                    if ($("#myvideo").length === 0) {
                      $("#videolocal").append(
                        '<video class="rounded centered" id="myvideo" width="100%" height="100%" autoplay playsinline muted="muted"/>'
                      );
                      // Add a 'mute' button
                      $("#videolocal").append(
                        '<button class="btn btn-warning btn-xs" id="mute" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;">Mute</button>'
                      );
                      $("#mute").click(toggleMute);
                      // Add an 'unpublish' button
                      $("#videolocal").append(
                        '<button class="btn btn-warning btn-xs" id="unpublish" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;">Unpublish</button>'
                      );
                      $("#unpublish").click(unpublishOwnFeed);
                    }
                    $("#publisher").removeClass("hide").html(myusername).show();
                    Janus.attachMediaStream($("#myvideo").get(0), stream);
                    $("#myvideo").get(0).muted = "muted";
                    if (
                      sfutest.webrtcStuff.pc.iceConnectionState !==
                        "completed" &&
                      sfutest.webrtcStuff.pc.iceConnectionState !== "connected"
                    ) {
                      $("#videolocal")
                        .parent()
                        .parent()
                        .block({
                          message: "<b>Publishing...</b>",
                          css: {
                            border: "none",
                            backgroundColor: "transparent",
                            color: "white",
                          },
                        });
                    }
                    var videoTracks = stream.getVideoTracks();
                    if (!videoTracks || videoTracks.length === 0) {
                      // No webcam
                      $("#myvideo").hide();
                      if ($("#videolocal .no-video-container").length === 0) {
                        $("#videolocal").append(
                          '<div class="no-video-container">' +
                            '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                            '<span class="no-video-text">No webcam available</span>' +
                            "</div>"
                        );
                      }
                    } else {
                      $("#videolocal .no-video-container").remove();
                      $("#myvideo").removeClass("hide").show();
                    }
                  },
                  onremotestream: function (stream) {
                    // The publisher stream is sendonly, we don't expect anything here
                  },
                  oncleanup: function () {
                    Janus.log(
                      " ::: Got a cleanup notification: we are unpublished now :::"
                    );
                    mystream = null;
                    $("#videolocal").html(
                      '<button id="publish" class="btn btn-primary">Publish</button>'
                    );
                    $("#publish").click(function () {
                      publishOwnFeed(true);
                    });
                    $("#videolocal").parent().parent().unblock();
                    $("#bitrate").parent().parent().addClass("hide");
                    $("#bitrate a").unbind("click");
                  },
                });
              },
              error: function (error) {
                Janus.error(error);
                bootbox.alert(error, function () {
                  window.location.reload();
                });
              },
              destroyed: function () {
                window.location.reload();
              },
            });
          });
        // Manual registration button click handler
        $("#register").click(function () {
          if ($("#username").val() === "") {
            bootbox.alert("Please insert a display name");
            return;
          }
          $("#username").attr("disabled", true);
          $(this).attr("disabled", true).unbind("click");
          var register = {
            request: "join",
            room: myroom,
            ptype: "publisher",
            display: $("#username").val(),
          };
          myusername = $("#username").val();
          sfutest.send({ message: register });
        });
      } // 🟢 if (myusername !== "" && myusername !== null) 블록 끝
    },
  });
});

function checkEnter(field, event) {
  var theCode = event.keyCode
    ? event.keyCode
    : event.which
    ? event.which
    : event.charCode;
  if (theCode == 13) {
    $("#register").click();
    return false;
  } else {
    return true;
  }
}

function getQueryStringValue(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function publishOwnFeed(useAudio) {
  // Publish our stream
  $("#publish").attr("disabled", true).unbind("click");
  sfutest.createOffer({
    // Add data: 'true' as well if you want to publish the data channel too
    media: { video: true, audio: useAudio, data: true }, // Publishers are always sendonly
    // If you want to test simulcasting:
    // simulcast: doSimulcast,
    // simulcast2: doSimulcast2,
    success: function (jsep) {
      Janus.debug("Got publisher SDP!", jsep);
      var publish = { request: "configure", audio: useAudio, video: true };
      // You can force a specific bitrate too
      //publish["bitrate"] = 256000;
      // In case you use simulcast and want to disable new streams
      //publish["simulcast"] = false;
      sfutest.send({ message: publish, jsep: jsep });
    },
    error: function (error) {
      Janus.error("WebRTC error:", error);
      if (useAudio) {
        publishOwnFeed(false);
      } else {
        bootbox.alert("WebRTC error... " + error.message);
        $("#publish")
          .removeAttr("disabled")
          .click(function () {
            publishOwnFeed(true);
          });
      }
    },
  });
}

function unpublishOwnFeed() {
  // Unpublish our stream
  $("#unpublish").attr("disabled", true).unbind("click");
  var unpublish = { request: "unpublish" };
  sfutest.send({ message: unpublish });
  sfutest.hangup();
}

function toggleMute() {
  var muted = sfutest.isAudioMuted();
  Janus.log((muted ? "Unmuting" : "Muting") + " local stream...");
  var buttonText = $("#mute").html();

  if (buttonText.includes("음소거 해제")) {
    sfutest.send({ message: { request: "configure", audio: true } });
    Janus.log("Unmuting local stream...");

    $("#mute").html("음소거");
  } else if (buttonText.includes("음소거")) {
    sfutest.send({ message: { request: "configure", audio: false } });
    Janus.log("Muting local stream...");

    $("#mute").html("음소거 해제");
  }
  // muted = sfutest.isAudioMuted();
  // $("#mute").html(muted ? "음소거 해재" : "음소거");
}

function unmute() {
  // Unmute our stream
  sfutest.unmute();
  $("#mute").html("Mute");
}

// 🟢 [추가] 이미 구독 중인 피드인지 확인하는 헬퍼 함수
function findRemoteFeed(id) {
  for (var i = 1; i < 6; i++) {
    if (feeds[i] && feeds[i].rfid == id) {
      return feeds[i];
    }
  }
  return null;
}

function newRemoteFeed(id, display, audio, video) {
  // 🚨 [핵심 FIX]: 1:1 세션에서는 모든 참여자가 상대방의 영상을 받아야 하므로,
  // 역할(myrole)에 따른 구독 제한 로직을 제거했습니다.

  /* 기존 코드 (삭제):
  if (myrole !== "student" && myrole !== "subscriber") {
    Janus.log(
      "Ignoring remote feed. Only subscribers/students should subscribe."
    );
    return;
  }
  */

  // A new feed has arrived, create a new plugin handle and attach a new remote feed to it
  var remoteFeed = null;
  janus.attach({
    plugin: "janus.plugin.videoroom",
    opaqueId: opaqueId,
    success: function (pluginHandle) {
      remoteFeed = pluginHandle;
      remoteFeed.remoteTrack = {};
      remoteFeed.simulcastStarted = false;
      Janus.log(
        "Plugin attached! (" +
          remoteFeed.getPlugin() +
          ", id=" +
          remoteFeed.getId() +
          ")"
      );
      Janus.log("  -- This is a subscriber");
      // We wait for the publisher to send us an offer
      var listen = {
        request: "join",
        room: myroom,
        ptype: "subscriber",
        feed: id,
        private_id: mypvtid,
      };
      // In case you use simulcasting (e.g., with WebRTC-SFU) and want to receive
      // the lowest quality layer, set streaming to true and default_layer to 0
      // listen["simulcast"] = doSimulcast;
      // listen["simulcast2"] = doSimulcast2;
      // listen["default_layer"] = 0;
      remoteFeed.send({ message: listen });
    },
    error: function (error) {
      Janus.error("  -- Error attaching plugin...", error);
      bootbox.alert("Error attaching plugin... " + error);
    },
    onmessage: function (msg, jsep) {
      Janus.debug(" ::: Got a message (subscriber) :::", msg);
      var event = msg["videoroom"];
      Janus.debug("Event: " + event);
      if (msg["error"]) {
        bootbox.alert(msg["error"]);
      } else if (event) {
        if (event === "attached") {
          // Subscriber attached; we look at the publishers and see if any new feed
          // is available, and, if so, we will end up attaching to it as well
          for (var i = 1; i < 6; i++) {
            if (!feeds[i]) {
              feeds[i] = remoteFeed;
              remoteFeed.rfindex = i;
              remoteFeed.rfid = msg["id"];
              remoteFeed.rfdisplay = msg["display"];
              if (
                remoteFeed.rfdisplay === null ||
                remoteFeed.rfdisplay === undefined
              )
                remoteFeed.rfdisplay = remoteFeed.rfid;
              break;
            }
          }
          if (!remoteFeed.spinner) {
            var target = document.getElementById(
              "videoremote" + remoteFeed.rfindex
            );
            remoteFeed.spinner = new Spinner({ top: 100 }).spin(target);
          } else {
            remoteFeed.spinner.spin();
          }
          Janus.log(
            "Successfully attached to feed " +
              remoteFeed.rfid +
              " (" +
              remoteFeed.rfdisplay +
              ") in room " +
              msg["room"]
          );
          $("#remote" + remoteFeed.rfindex)
            .removeClass("hide")
            .html(remoteFeed.rfdisplay)
            .show();
        } else if (event === "event") {
          // Check if we got a simulcast first
          var substream = msg["substream"];
          var temporal = msg["temporal"];
          if (
            (substream !== null && substream !== undefined) ||
            (temporal !== null && temporal !== undefined)
          ) {
            if (!remoteFeed.simulcastStarted) {
              remoteFeed.simulcastStarted = true;
              // Add some UI for simulcast
              addSimulcastSwithing(remoteFeed.rfindex);
            }
            // We just received notice that an encoder quality change happened on the publisher
            updateSimulcastLayer(remoteFeed.rfindex, substream, temporal);
          }
        } else {
          // What has just happened?
        }
      }
      if (jsep) {
        Janus.debug("Handling SDP as well...", jsep);
        // Answer and attach
        remoteFeed.createAnswer({
          jsep: jsep,
          // Add data: true if you want to subscribe to the data channel too
          media: { video: true, audio: true, data: true }, // We want everything!
          success: function (jsep) {
            Janus.debug("Got SDP for subscriber!", jsep);
            var body = { request: "start", room: myroom };
            remoteFeed.send({ message: body, jsep: jsep });
          },
          error: function (error) {
            Janus.error("WebRTC error:", error);
            bootbox.alert("WebRTC error... " + error.message);
          },
        });
      }
    },
    onlocalstream: function (stream) {
      // The publisher stream is sendonly, we don't expect anything here
    },
    onremotestream: function (stream) {
      Janus.debug("Remote feed #" + remoteFeed.rfindex + ", stream:", stream);
      var addButtons = false;
      if ($("#remoteprogress" + remoteFeed.rfindex).length === 0) {
        addButtons = true;
        // No remote video yet
        $("#videoremote" + remoteFeed.rfindex).append(
          '<video class="rounded centered" id="remotevideo' +
            remoteFeed.rfindex +
            '" width="100%" height="100%" autoplay playsinline/>'
        );
        // Hide the spinner
        remoteFeed.spinner.stop();
        remoteFeed.spinner = null;
        // If we are not dealing with simulcast/svc, update the bitrate now
        if (
          !Janus.webRTCAdapter.browserDetails.extention &&
          !remoteFeed.simulcastStarted
        )
          bitrateTimer[remoteFeed.rfindex] = setInterval(function () {
            // Check if there's a need to switch to a higher bitrate
            updateBitrate(remoteFeed.rfindex);
          }, 1000);
      }
      Janus.attachMediaStream(
        $("#remotevideo" + remoteFeed.rfindex).get(0),
        stream
      );
      var videoTracks = stream.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0) {
        // No remote video
        $("#remotevideo" + remoteFeed.rfindex).hide();
        if (
          $("#videoremote" + remoteFeed.rfindex + " .no-video-container")
            .length === 0
        ) {
          $("#videoremote" + remoteFeed.rfindex).append(
            '<div class="no-video-container">' +
              '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
              '<span class="no-video-text">No remote video available</span>' +
              "</div>"
          );
        }
      } else {
        $(
          "#videoremote" + remoteFeed.rfindex + " .no-video-container"
        ).remove();
        $("#remotevideo" + remoteFeed.rfindex)
          .removeClass("hide")
          .show();
      }
      if (!addButtons) return;
      // Add the simulcast button to switch quality on the fly
      if (
        Janus.webRTCAdapter.browserDetails.extention ||
        remoteFeed.simulcastStarted
      ) {
        $("#remote" + remoteFeed.rfindex)
          .parent()
          .find(".btn-group")
          .removeClass("hide")
          .show();
      }
    },
    oncleanup: function () {
      Janus.log(
        " ::: Got a cleanup notification (remote feed " +
          remoteFeed.rfid +
          ") :::"
      );
      if (remoteFeed.spinner) remoteFeed.spinner.stop();
      remoteFeed.spinner = null;
      $("#remotevideo" + remoteFeed.rfindex).remove();
      $("#remote" + remoteFeed.rfindex)
        .empty()
        .hide();
      if (bitrateTimer[remoteFeed.rfindex])
        clearInterval(bitrateTimer[remoteFeed.rfindex]);
      bitrateTimer[remoteFeed.rfindex] = null;
      remoteFeed.simulcastStarted = false;
      $("#remote" + remoteFeed.rfindex)
        .parent()
        .find(".btn-group")
        .addClass("hide")
        .hide();
    },
  });
}

function updateBitrate(feed) {
  if (!feeds[feed]) return;
  // 🟢 [수정] 구문 오류 수정: 함수 이름의 띄어쓰기를 제거했습니다.
  feeds[feed].getBitrate({
    success: function (value) {
      $("#curbitrate" + feeds[feed].rfindex)
        .removeClass("hide")
        .show()
        .html(value);
    },
  });
}

function switchSimulcastLayer(feed, substream) {
  var remoteFeed = feeds[feed];
  if (!remoteFeed) return;
  remoteFeed.send({ message: { request: "configure", substream: substream } });
}

function switchTemporalLayer(feed, temporal) {
  var remoteFeed = feeds[feed];
  if (!remoteFeed) return;
  remoteFeed.send({ message: { request: "configure", temporal: temporal } });
}

function updateSimulcastLayer(feed, substream, temporal) {
  var remoteFeed = feeds[feed];
  if (!remoteFeed) return;
  // Check the simulcast layer
  if (substream === 0) {
    toastr.success("Capped simulcast substream! (lowest quality)", null, {
      timeOut: 2000,
    });
    $("#sl" + remoteFeed.rfindex + "-2")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#sl" + remoteFeed.rfindex + "-1")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#sl" + remoteFeed.rfindex + "-0")
      .removeClass("btn-primary btn-info btn-success")
      .addClass("btn-success");
  } else if (substream === 1) {
    toastr.success("Capped simulcast substream! (medium quality)", null, {
      timeOut: 2000,
    });
    $("#sl" + remoteFeed.rfindex + "-2")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#sl" + remoteFeed.rfindex + "-1")
      .removeClass("btn-primary btn-info btn-success")
      .addClass("btn-success");
    $("#sl" + remoteFeed.rfindex + "-0")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
  } else if (substream === 2) {
    toastr.success("Capped simulcast substream! (highest quality)", null, {
      timeOut: 2000,
    });
    $("#sl" + remoteFeed.rfindex + "-2")
      .removeClass("btn-primary btn-info btn-success")
      .addClass("btn-success");
    $("#sl" + remoteFeed.rfindex + "-1")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#sl" + remoteFeed.rfindex + "-0")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
  }
  // Check the temporal layer
  if (temporal === 0) {
    toastr.success("Capped simulcast temporal layer! (lowest FPS)", null, {
      timeOut: 2000,
    });
    $("#tl" + remoteFeed.rfindex + "-2")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#tl" + remoteFeed.rfindex + "-1")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#tl" + remoteFeed.rfindex + "-0")
      .removeClass("btn-primary btn-info btn-success")
      .addClass("btn-success");
  } else if (temporal === 1) {
    toastr.success("Capped simulcast temporal layer! (medium FPS)", null, {
      timeOut: 2000,
    });
    $("#tl" + remoteFeed.rfindex + "-2")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#tl" + remoteFeed.rfindex + "-1")
      .removeClass("btn-primary btn-info btn-success")
      .addClass("btn-success");
    $("#tl" + remoteFeed.rfindex + "-0")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
  } else if (temporal === 2) {
    toastr.success("Capped simulcast temporal layer! (highest FPS)", null, {
      timeOut: 2000,
    });
    $("#tl" + remoteFeed.rfindex + "-2")
      .removeClass("btn-primary btn-info btn-success")
      .addClass("btn-success");
    $("#tl" + remoteFeed.rfindex + "-1")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
    $("#tl" + remoteFeed.rfindex + "-0")
      .removeClass("btn-primary btn-success")
      .addClass("btn-primary");
  }
}

function addSimulcastSwithing(index) {
  var html =
    '<div class="btn-group btn-group-xs pull-right">' +
    '<div class="btn-group btn-group-xs dropup">' +
    '<button id="sl' +
    index +
    '" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" autocomplete="off"> ' +
    'Stream: <span class="label label-success"><b>H</b></span>' +
    '<span class="caret"></span> ' +
    "</button>" +
    '<ul class="dropdown-menu" role="menu">' +
    '<li><a href="#" id="sl' +
    index +
    '-2">High</a></li>' +
    '<li><a href="#" id="sl' +
    index +
    '-1">Medium</a></li>' +
    '<li><a href="#" id="sl' +
    index +
    '-0">Low</a></li>' +
    "</ul>" +
    "</div>" +
    '<div class="btn-group btn-group-xs dropup">' +
    '<button id="tl' +
    index +
    '" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" autocomplete="off"> ' +
    'Temporal: <span class="label label-success"><b>3</b></span>' +
    '<span class="caret"></span> ' +
    "</button>" +
    '<ul class="dropdown-menu" role="menu">' +
    '<li><a href="#" id="tl' +
    index +
    '-2">3/3</a></li>' +
    '<li><a href="#" id="tl' +
    index +
    '-1">2/3</a></li>' +
    '<li><a href="#" id="tl' +
    index +
    '-0">1/3</a></li>' +
    "</ul>" +
    "</div>" +
    "</div>";
  $("#remote" + index)
    .parent()
    .find(".btn-group")
    .removeClass("hide")
    .html(html)
    .show();
  $("#sl" + index + "-0")
    .unbind("click")
    .click(function () {
      if (
        $("#sl" + index)
          .find("span")
          .hasClass("label-danger")
      )
        return false;
      switchSimulcastLayer(index, 0);
      return false;
    });
  $("#sl" + index + "-1")
    .unbind("click")
    .click(function () {
      if (
        $("#sl" + index)
          .find("span")
          .hasClass("label-danger")
      )
        return false;
      switchSimulcastLayer(index, 1);
      return false;
    });
  $("#sl" + index + "-2")
    .unbind("click")
    .click(function () {
      if (
        $("#sl" + index)
          .find("span")
          .hasClass("label-danger")
      )
        return false;
      switchSimulcastLayer(index, 2);
      return false;
    });
  $("#tl" + index + "-0")
    .unbind("click")
    .click(function () {
      if (
        $("#tl" + index)
          .find("span")
          .hasClass("label-danger")
      )
        return false;
      switchTemporalLayer(index, 0);
      return false;
    });
  $("#tl" + index + "-1")
    .unbind("click")
    .click(function () {
      if (
        $("#tl" + index)
          .find("span")
          .hasClass("label-danger")
      )
        return false;
      switchTemporalLayer(index, 1);
      return false;
    });
  $("#tl" + index + "-2")
    .unbind("click")
    .click(function () {
      if (
        $("#tl" + index)
          .find("span")
          .hasClass("label-danger")
      )
        return false;
      switchTemporalLayer(index, 2);
      return false;
    });
}

function autoJoinRoom(roomname, username, role) {
  // 1. 방 번호 유효성 검사 및 타입 변환
  var roomNumber = parseInt(roomname);
  if (isNaN(roomNumber)) {
    // roomname이 숫자로 변환되지 않은 경우 (예: "SCH1234" 등)
    Janus.error(
      "Invalid Room Number: " + roomname + ". Please check URL parameter."
    );
    bootbox.alert(
      "유효하지 않은 방 번호입니다. URL의 'room' 파라미터를 확인해주세요."
    );
    return;
  }

  // 2. Janus VideoRoom에서는 쌍방향 통신을 위해 모든 사용자가 'publisher'로 접속해야 합니다.
  var ptype = "publisher";

  Janus.log("Attempting to Join Room ID: " + roomNumber + " as " + ptype);

  // 3. 방 번호 표시
  $("#room-display").removeClass("hide");
  $("#room").html(roomNumber);

  // 4. 방 생성 시도 (첫 번째 사용자는 방을 생성하고, 두 번째 사용자는 'Room already exists' 에러를 받습니다.)
  // 이 에러는 Janus에서 정상적인 동작이므로 무시하고 Join을 시도합니다.
  var createRoom = {
    request: "create",
    room: roomNumber,
    permanent: false,
    record: false,
    publishers: 6,
    bitrate: 128000,
    fir_freq: 10,
    ptype: ptype, // Publisher로 일관성 유지
    description: "counseling_room",
    is_private: false,
  };

  // 5. 방 참여 (Join) 요청 메시지 생성
  var register = {
    request: "join",
    room: roomNumber,
    display: username,
    ptype: ptype, // 핵심: 모든 사용자는 Publisher로 참여
  };

  // 먼저 방 생성을 시도합니다.
  sfutest.send({
    message: createRoom,
    success: function (result) {
      // 서버에서 응답을 받으면 (성공 또는 'Room already exists'와 같은 플러그인 레벨 오류) 바로 참여 요청을 보냅니다.
      Janus.log("Room Create Attempt Response Received. Proceeding to Join.");

      myusername = username;
      sfutest.send({ message: register });

      Janus.log(
        "Room Join Attempt Sent: " +
          username +
          " to room " +
          roomNumber +
          " as " +
          ptype
      );
    },
    error: function (error) {
      // Janus 서버와의 통신 자체에 실패한 경우, 안전하게 Join을 시도합니다.
      Janus.warn(
        "Room Create API Call Failed. Attempting to Join directly. Error:",
        error
      );

      myusername = username;
      sfutest.send({ message: register });

      Janus.log(
        "Room Join Attempt Sent (After Create Failure): " +
          username +
          " to room " +
          roomNumber +
          " as " +
          ptype
      );
    },
  });
}
